import base64
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

import requests
from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError

from app.handler.fatcory import PityResponse
from app.models import async_session
from app.models.functional_case import PityFunctionalCaseSkillDoc, PityFunctionalCaseSkillTask
from app.models.user import User
from app.routers import Permission
from app.schema.functional_case import FunctionalCaseAIGenerateForm, FunctionalCaseSkillDocForm, FunctionalCaseSkillTaskForm
from app.utils.logger import Log
from config import Config

router = APIRouter(prefix="/functional-case")
logger = Log("functional_case_skill")

AI_CASE_CREATOR_ROOT = r"C:\Users\bytde\Desktop\ai_case_creator"
SKILL_TASK_DIR = os.path.join("statics", "functional_case_skill_tasks")
AI_TEXT_LIMIT = 12000
AI_INSTRUCTION_LIMIT = 6000
AI_IMAGE_LIMIT = 6
AI_IMAGE_DATA_URL_LIMIT = 2_000_000
SKILL_TASK_SCHEMA_READY = False
REVIEW_MAX_ROUNDS = 2


def serialize_model(model):
    return PityResponse.model_to_dict(model)


async def ensure_skill_task_schema(session):
    global SKILL_TASK_SCHEMA_READY
    if SKILL_TASK_SCHEMA_READY:
        return
    try:
        for column_name, sql in [
            ("description", "ALTER TABLE pity_functional_case_skill_doc ADD COLUMN description VARCHAR(500) NULL COMMENT '文档描述'"),
            ("input_payload", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN input_payload TEXT NULL COMMENT '任务输入'"),
            ("stage", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN stage VARCHAR(64) NOT NULL DEFAULT 'queued' COMMENT '执行阶段'"),
            ("stage_text", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN stage_text VARCHAR(255) NULL COMMENT '阶段说明'"),
            ("progress", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN progress INT NOT NULL DEFAULT 0 COMMENT '进度'"),
            ("review_provider", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN review_provider VARCHAR(32) NULL COMMENT '评审模型'"),
            ("review_rounds", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN review_rounds INT NOT NULL DEFAULT 0 COMMENT '评审轮次'"),
            ("task_logs", "ALTER TABLE pity_functional_case_skill_task ADD COLUMN task_logs TEXT NULL COMMENT '任务日志'"),
        ]:
            result = await session.execute(text(f"SHOW COLUMNS FROM {'pity_functional_case_skill_doc' if column_name == 'description' else 'pity_functional_case_skill_task'} LIKE '{column_name}'"))
            if result.first() is None:
                await session.execute(text(sql))
        await session.commit()
    except OperationalError as exc:
        if "Duplicate column name" not in str(exc):
            raise
    SKILL_TASK_SCHEMA_READY = True


def pick_user_name(user):
    if user is None:
        return ""
    return (user.name or user.username or "").strip()


def truncate_ai_text(value, limit):
    text_value = str(value or "").strip()
    if len(text_value) <= limit:
        return text_value
    return f"{text_value[:limit]}\n\n[内容已截断，共{len(text_value)}字符，仅保留前{limit}字符]"


def compact_ai_images(images):
    compacted = []
    for image in (images or [])[:AI_IMAGE_LIMIT]:
        image_value = str(image or "").strip()
        if not image_value:
            continue
        if image_value.startswith("data:image") and len(image_value) > AI_IMAGE_DATA_URL_LIMIT:
            continue
        compacted.append(image_value)
    return compacted


def preview_text(value, limit=300):
    text_value = str(value or "").strip()
    if len(text_value) <= limit:
        return text_value
    return f"{text_value[:limit]} ...<truncated {len(text_value) - limit} chars>"


def read_text_if_exists(path):
    if not path or not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as file:
        return file.read().strip()


def get_builtin_context_text():
    parts = []
    for relative_path, title in [
        (os.path.join("1_规范与标准", "测试用例编写规范.md"), "系统内置规范"),
        (os.path.join("2_模板", "测试用例模板.md"), "系统内置模板"),
        (os.path.join("3_skills", "create_case.md"), "系统内置生成技能"),
        (os.path.join("3_skills", "evaluate_case.md"), "系统内置评审技能"),
    ]:
        text_value = read_text_if_exists(os.path.join(AI_CASE_CREATOR_ROOT, relative_path))
        if text_value:
            parts.append(f"{title}：\n{text_value}")
    return "\n\n".join(parts)


def build_ai_prompt_content(form: FunctionalCaseAIGenerateForm, extra_context_text=""):
    requirement_text = truncate_ai_text(form.requirement_text, AI_TEXT_LIMIT)
    instruction_text = truncate_ai_text(form.instruction_text, AI_INSTRUCTION_LIMIT)
    images = compact_ai_images(form.images or [])
    text_parts = [
        "你是资深测试分析师，请根据需求材料生成功能测试用例脑图。",
        f"当前用例标题：{form.title}",
        "请严格只返回 JSON，不要返回 Markdown、解释、注释、代码块标记。",
        (
            "JSON 结构必须为："
            '{"title":"用例标题","data":{"text":"根节点"},"children":[{"data":{"text":"节点文本","icon":["priority_1","progress_3"],"note":"可选备注","tag":["可选标签"]},"children":[]}]}'
        ),
        "约束：1. 所有节点都必须使用 data.text。2. 真正测试用例节点请用 icon 中的 priority_1 到 priority_9 标记优先级。3. children 必须始终返回数组。4. 文本使用中文。5. 覆盖正常、异常、边界场景。6. 请尽量按 模块-功能-子功能-字段-用例名称-预期 的层级组织。",
    ]
    if extra_context_text:
        text_parts.append(f"补充技能与规范材料：\n{truncate_ai_text(extra_context_text, 16000)}")
    if requirement_text:
        text_parts.append(f"需求描述：\n{requirement_text}")
    if instruction_text:
        text_parts.append(f"额外生成要求：\n{instruction_text}")
    if images:
        text_parts.append(f"还有 {len(images)} 张需求截图，请结合截图内容生成。")
    content = [{"type": "text", "text": "\n\n".join(text_parts)}]
    for image in images:
        content.append({"type": "image_url", "image_url": {"url": image}})
    return content


def build_loggable_kimi_payload(payload):
    try:
        cloned = json.loads(json.dumps(payload, ensure_ascii=False))
    except Exception:
        return {"payload_preview": preview_text(payload, 2000)}
    messages = cloned.get("messages") or []
    for message_item in messages:
        content = message_item.get("content")
        if isinstance(content, list):
            normalized_content = []
            for block in content:
                if not isinstance(block, dict):
                    normalized_content.append(block)
                    continue
                if block.get("type") == "image_url":
                    image_url = block.get("image_url") or {}
                    url_value = str(image_url.get("url") or "")
                    normalized_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"<{'data_url' if url_value.startswith('data:image') else 'url'}, length={len(url_value)}>"}
                    })
                else:
                    next_block = dict(block)
                    if "text" in next_block:
                        next_block["text"] = preview_text(next_block.get("text"), 4000)
                    normalized_content.append(next_block)
            message_item["content"] = normalized_content
    return cloned


def extract_json_object(text_value):
    text_value = str(text_value or "").strip()
    if not text_value:
        raise ValueError("AI 未返回内容")
    try:
        return json.loads(text_value)
    except Exception:
        pass
    fenced = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text_value, re.IGNORECASE)
    for item in fenced:
        try:
            return json.loads(item)
        except Exception:
            continue
    start = text_value.find("{")
    end = text_value.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text_value[start:end + 1])
    raise ValueError("AI 返回结果不是有效 JSON")


def normalize_ai_node(node):
    if isinstance(node, str):
        return {"data": {"text": node}, "children": []}
    if not isinstance(node, dict):
        return {"data": {"text": "未命名节点"}, "children": []}
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    text_value = str(data.get("text") or node.get("text") or node.get("title") or "未命名节点").strip() or "未命名节点"
    normalized_data = {"text": text_value}
    for key in ("icon", "note", "tag", "hyperlink"):
        value = data.get(key) if key in data else node.get(key)
        if value not in (None, "", []):
            normalized_data[key] = value
    raw_children = node.get("children") if isinstance(node.get("children"), list) else []
    return {"data": normalized_data, "children": [normalize_ai_node(child) for child in raw_children]}


def normalize_ai_case_data(payload, fallback_title):
    if not isinstance(payload, dict):
        raise ValueError("AI 返回结果格式不正确")
    title = str(payload.get("title") or fallback_title or "AI生成功能用例").strip() or "AI生成功能用例"
    if "root" in payload and isinstance(payload.get("root"), dict):
        root_node = normalize_ai_node(payload.get("root"))
    elif "data" in payload and isinstance(payload.get("data"), dict):
        root_node = normalize_ai_node({"data": payload.get("data"), "children": payload.get("children") or []})
    else:
        root_node = normalize_ai_node(payload)
    if not root_node.get("data", {}).get("text"):
        root_node["data"]["text"] = title
    return title, root_node


def analyze_case_data(data):
    if not isinstance(data, dict):
        return {"case_count": 0}
    case_count = 0

    def walk(node):
        nonlocal case_count
        node_data = node.get("data") if isinstance(node, dict) else {}
        node_icons = node_data.get("icon") if isinstance(node_data, dict) else []
        icons = node_icons if isinstance(node_icons, list) else [node_icons] if node_icons else []
        if any(isinstance(icon, str) and icon.startswith("priority_") for icon in icons):
            case_count += 1
        for child in node.get("children") or []:
            walk(child)

    walk(data)
    return {"case_count": case_count}


def call_kimi_generate(form: FunctionalCaseAIGenerateForm, extra_context_text=""):
    if not Config.KIMI_API_KEY:
        raise ValueError("未配置 Kimi API Key")
    prompt_content = build_ai_prompt_content(form, extra_context_text=extra_context_text)
    request_payload = {
        "model": Config.KIMI_MODEL,
        "temperature": 1,
        "messages": [
            {"role": "system", "content": "你只输出符合要求的 JSON，对象内不要出现 markdown 代码块标记。"},
            {"role": "user", "content": prompt_content},
        ],
    }
    logger.info(f"Kimi skill payload: {json.dumps(build_loggable_kimi_payload(request_payload), ensure_ascii=False)}")
    started_at = time.perf_counter()
    response = requests.post(
        f"{Config.KIMI_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {Config.KIMI_API_KEY}", "Content-Type": "application/json"},
        json=request_payload,
        timeout=600,
    )
    elapsed = round(time.perf_counter() - started_at, 2)
    logger.info(f"Kimi skill status={response.status_code}, elapsed={elapsed}s, preview={preview_text(response.text, 1000)}")
    if response.status_code >= 400:
        try:
            detail = response.json()
        except Exception:
            detail = response.text
        raise ValueError(f"Kimi 调用失败: {detail}")
    payload = response.json()
    choices = payload.get("choices") or []
    if not choices:
        raise ValueError("Kimi 未返回可用结果")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        text_parts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "text"]
        content = "\n".join(text_parts)
    if not isinstance(content, str):
        raise ValueError("Kimi 返回内容格式不支持")
    return extract_json_object(content)


def call_kimi_json_prompt(system_prompt, user_prompt, temperature=1):
    if not Config.KIMI_API_KEY:
        raise ValueError("未配置 Kimi API Key")
    request_payload = {
        "model": Config.KIMI_MODEL,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    response = requests.post(
        f"{Config.KIMI_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {Config.KIMI_API_KEY}", "Content-Type": "application/json"},
        json=request_payload,
        timeout=600,
    )
    if response.status_code >= 400:
        try:
            detail = response.json()
        except Exception:
            detail = response.text
        raise ValueError(f"Kimi 调用失败: {detail}")
    payload = response.json()
    choices = payload.get("choices") or []
    if not choices:
        raise ValueError("Kimi 未返回可用结果")
    content = (choices[0].get("message") or {}).get("content")
    if isinstance(content, list):
        text_parts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "text"]
        content = "\n".join(text_parts)
    return extract_json_object(content)


def call_claude_json_prompt(system_prompt, user_prompt, temperature=0.2):
    api_key = getattr(Config, "CLAUDE_API_KEY", "") or os.getenv("CLAUDE_API_KEY", "")
    base_url = getattr(Config, "CLAUDE_BASE_URL", "") or os.getenv("CLAUDE_BASE_URL", "https://api.anthropic.com/v1")
    model = getattr(Config, "CLAUDE_MODEL", "") or os.getenv("CLAUDE_MODEL", "claude-3-7-sonnet-latest")
    if not api_key:
        raise ValueError("未配置 Claude API Key")
    payload = {
        "model": model,
        "max_tokens": 8192,
        "temperature": temperature,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }
    response = requests.post(
        f"{base_url}/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=600,
    )
    if response.status_code >= 400:
        try:
            detail = response.json()
        except Exception:
            detail = response.text
        raise ValueError(f"Claude 调用失败: {detail}")
    body = response.json()
    content = body.get("content") or []
    text_parts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "text"]
    return extract_json_object("\n".join(text_parts))


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def write_text(path, content):
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as file:
        file.write(content)


def file_path_to_static_url(file_path):
    if not file_path:
        return ""
    normalized = os.path.normpath(file_path)
    statics_root = os.path.normpath("statics")
    try:
        relative_path = os.path.relpath(normalized, statics_root)
    except ValueError:
        return ""
    if relative_path.startswith(".."):
        return ""
    return f"/statics/{relative_path.replace(os.sep, '/')}"


def append_task_log(task, stage, stage_text):
    if not stage_text:
        return
    try:
        logs = json.loads(task.task_logs or "[]")
        if not isinstance(logs, list):
            logs = []
    except Exception:
        logs = []
    logs.append({
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "stage": stage,
        "text": stage_text,
    })
    task.task_logs = json.dumps(logs[-50:], ensure_ascii=False)


def save_data_url_image(image_value, output_path):
    matched = re.match(r"^data:image/([a-zA-Z0-9.+-]+);base64,(.+)$", image_value)
    if not matched:
        return False
    ensure_dir(os.path.dirname(output_path))
    with open(output_path, "wb") as file:
        file.write(base64.b64decode(matched.group(2)))
    return True


def export_runtime_materials(task_dir, requirement_text, instruction_text, images, docs):
    requirement_dir = os.path.join(task_dir, "需求文档")
    standard_dir = os.path.join(task_dir, "规范与标准")
    skills_dir = os.path.join(task_dir, "skills")

    write_text(
        os.path.join(requirement_dir, "需求文档详细说明文档.md"),
        requirement_text or "# 需求文档\n\n未提供需求正文",
    )
    if instruction_text:
        write_text(os.path.join(task_dir, "生成提示词.md"), instruction_text)
    for index, image_value in enumerate(images or [], start=1):
        image_prefix = os.path.join(requirement_dir, f"需求截图_{index}")
        if image_value.startswith("data:image"):
            save_data_url_image(image_value, f"{image_prefix}.png")
        else:
            write_text(f"{image_prefix}.txt", image_value)

    for doc in docs:
        safe_title = re.sub(r'[\\/:*?"<>|]+', "_", doc["title"]).strip() or f"doc_{doc['id']}"
        if doc.get("doc_type") == "skill_md":
            target_dir = skills_dir
            target_name = f"用户技能_{safe_title}.md"
        else:
            target_dir = standard_dir
            target_name = f"用户文档_{safe_title}.md"
        write_text(os.path.join(target_dir, target_name), doc["content"])

    builtin_files = [
        (os.path.join("1_规范与标准", "测试用例编写规范.md"), os.path.join(standard_dir, "测试用例编写规范.md")),
        (os.path.join("2_模板", "测试用例模板.md"), os.path.join(standard_dir, "测试用例模板.md")),
        (os.path.join("3_skills", "create_case.md"), os.path.join(skills_dir, "create_case.md")),
        (os.path.join("3_skills", "evaluate_case.md"), os.path.join(skills_dir, "evaluate_case.md")),
    ]
    for relative_path, target_path in builtin_files:
        source_path = os.path.join(AI_CASE_CREATOR_ROOT, relative_path)
        if os.path.exists(source_path):
            ensure_dir(os.path.dirname(target_path))
            shutil.copy2(source_path, target_path)


def build_extra_context(docs):
    parts = []
    builtin = get_builtin_context_text()
    if builtin:
        parts.append(builtin)
    for doc in docs:
        parts.append(f"用户文档[{doc['doc_type']}]-{doc['title']}：\n{doc['content']}")
    return "\n\n".join(parts)


def build_review_context(task_payload, docs):
    return "\n\n".join(filter(None, [
        get_builtin_context_text(),
        "\n\n".join([f"用户文档[{doc['doc_type']}]-{doc['title']}：\n{doc['content']}" for doc in docs]),
        f"需求描述：\n{task_payload.get('requirement_text') or ''}",
        f"额外要求：\n{task_payload.get('instruction_text') or ''}",
    ]))


def review_case_payload(case_title, case_data, task_payload, docs):
    review_context = build_review_context(task_payload, docs)
    user_prompt = (
        "请你作为功能测试用例评审专家，对当前测试用例进行审查。\n\n"
        "要求：\n"
        "1. 结合需求、模板、规范、用户技能文档审查覆盖度、结构合理性、优先级和异常场景。\n"
        "2. 如果不通过，请直接给出修正后的 JSON 用例树 revised_case。\n"
        "3. 只返回 JSON。\n\n"
        "返回格式："
        '{"passed":true,"summary":"通过/不通过原因","issues":["问题1"],"revised_case":{"title":"可选","data":{"text":"根节点"},"children":[]}}\n\n'
        f"审查材料：\n{truncate_ai_text(review_context, 24000)}\n\n"
        f"当前用例标题：{case_title}\n"
        f"当前用例 JSON：\n{json.dumps(case_data, ensure_ascii=False)}"
    )
    system_prompt = "你是严格的测试用例评审专家，只返回 JSON，不返回 Markdown。"
    api_key = getattr(Config, "CLAUDE_API_KEY", "") or os.getenv("CLAUDE_API_KEY", "")
    provider = "claude" if api_key else "kimi"
    payload = call_claude_json_prompt(system_prompt, user_prompt) if api_key else call_kimi_json_prompt(system_prompt, user_prompt)
    return provider, payload


def fix_case_payload(case_title, case_data, review_payload, task_payload, docs):
    fix_context = build_review_context(task_payload, docs)
    issues_text = "\n".join([f"- {item}" for item in (review_payload.get("issues") or [])])
    user_prompt = (
        "请根据评审问题修正功能测试用例脑图，返回修正后的 JSON。\n\n"
        "返回格式："
        '{"title":"用例标题","data":{"text":"根节点"},"children":[]}\n\n'
        f"需求与规范材料：\n{truncate_ai_text(fix_context, 24000)}\n\n"
        f"当前标题：{case_title}\n"
        f"当前用例 JSON：\n{json.dumps(case_data, ensure_ascii=False)}\n\n"
        f"评审问题：\n{issues_text or '- 无'}"
    )
    payload = call_kimi_json_prompt("你是测试用例修正助手，只返回 JSON。", user_prompt, temperature=1)
    return payload


def markdown_lines_from_node(node, depth=0):
    text_value = str((node.get("data") or {}).get("text") or "未命名节点").strip() or "未命名节点"
    prefix = "  " * depth
    lines = [f"{prefix}- {text_value}"]
    for child in node.get("children") or []:
        lines.extend(markdown_lines_from_node(child, depth + 1))
    return lines


def write_markdown_from_tree(root_node, title, output_path):
    root = {"data": {"text": title}, "children": root_node.get("children") or []}
    lines = markdown_lines_from_node(root)
    write_text(output_path, "\n".join(lines))


def extract_priority_icons(text_value):
    match = re.search(r"[（(](P[0-2])[）)]", str(text_value or ""), re.IGNORECASE)
    if not match:
        return []
    priority = match.group(1).upper()
    mapping = {"P0": "priority_1", "P1": "priority_2", "P2": "priority_3"}
    icon = mapping.get(priority)
    return [icon] if icon else []


def parse_markdown_case_tree(markdown_text, fallback_title):
    roots = []
    stack = []
    for raw_line in str(markdown_text or "").splitlines():
        if not raw_line.strip():
            continue
        stripped = raw_line.lstrip(" ")
        if not stripped.startswith("- "):
            continue
        indent = len(raw_line) - len(stripped)
        text_value = stripped[2:].strip() or "未命名节点"
        node = {"data": {"text": text_value}, "children": []}
        icons = extract_priority_icons(text_value)
        if icons:
            node["data"]["icon"] = icons
        while stack and stack[-1][0] >= indent:
            stack.pop()
        if stack:
            stack[-1][1]["children"].append(node)
        else:
            roots.append(node)
        stack.append((indent, node))
    if not roots:
        raise ValueError("未从 Markdown 中解析到有效的用例树")
    title = str(fallback_title or "功能用例").strip() or "功能用例"
    return title, {"data": {"text": title}, "children": roots}


def build_claude_code_prompt(task_payload, docs, task_dir):
    title = str(task_payload.get("title") or "功能用例").strip() or "功能用例"
    requirement_text = str(task_payload.get("requirement_text") or "").strip()
    instruction_text = str(task_payload.get("instruction_text") or "").strip()
    builtin_context = get_builtin_context_text()
    image_files = []
    requirement_dir = os.path.join(task_dir, "需求文档")
    if os.path.isdir(requirement_dir):
        for file_name in sorted(os.listdir(requirement_dir)):
            lower_name = file_name.lower()
            if lower_name.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")):
                image_files.append(os.path.join(requirement_dir, file_name))

    prompt_lines = [
        "你当前位于一个测试用例需求目录。",
        "注意：由于本地文件加密环境影响，下面已经直接提供了需求正文、规范与技能的明文内容。",
        "对于 Markdown 和文本材料，请优先使用本次输入中的明文内容，不要依赖重新读取本地 md 文件。",
        "对于需求截图，请继续读取本地 需求文档 目录下的图片文件。",
        "",
        f"当前测试用例标题：{title}",
        "",
        "请完成以下任务：",
        "1. 基于下方给出的需求正文、规范材料、技能材料，以及本地图片文件，生成或覆盖当前目录下的 功能测试用例.md。",
        "2. 生成完成后，依据下方给出的评审要求进行自审。",
        "3. 若发现问题，请直接修正 功能测试用例.md，直到结果可交付。",
        "4. 最终只保留一个可交付的 功能测试用例.md。",
        "",
        "Markdown 输出要求：",
        "1. 使用 Markdown 层级列表，统一用 '- ' 作为每一行前缀。",
        "2. 结构尽量遵循：模块 -> 功能 -> 子功能 -> 字段 -> 用例名称 -> 预期。",
        "3. 用例名称必须写成：用例名称: xxx（P0/P1/P2）。",
        "4. 每条用例名称的下一层只保留预期，例如：预期: xxx。",
        "5. 文本使用中文。",
        "6. 覆盖正常、异常、边界、失败反馈、状态保留、关键交互拦截场景。",
        "7. 不要生成 xmind 文件，不要输出 JSON 文件。",
        "",
        "需求截图文件：",
    ]
    if image_files:
        prompt_lines.extend([f"- {item}" for item in image_files])
    else:
        prompt_lines.append("- 未提供图片文件")

    prompt_lines.extend([
        "",
        "需求正文：",
        requirement_text or "未提供需求正文，请结合图片和其他材料处理。",
        "",
        "系统内置规范与技能：",
        truncate_ai_text(builtin_context, 24000) or "未提供系统内置规范与技能。",
        "",
        "用户选择的技能与文档：",
    ])
    if docs:
        for doc in docs:
            prompt_lines.extend([
                f"【{doc.get('doc_type') or 'doc'}】{doc.get('title') or '未命名文档'}",
                truncate_ai_text(doc.get("content") or "", 12000) or "空文档",
                "",
            ])
    else:
        prompt_lines.append("未选择用户技能或文档。")

    if instruction_text:
        prompt_lines.extend(["", "本次生成提示词：", instruction_text])

    prompt_lines.extend(["", "完成后请只输出：DONE"])
    return "\n".join(prompt_lines)


def run_claude_code_generate(task_dir, task_payload, docs):
    prompt_text = build_claude_code_prompt(task_payload, docs, task_dir)
    prompt_path = os.path.join(task_dir, "claude_task_prompt.txt")
    write_text(prompt_path, prompt_text)
    claude_executable = (
        shutil.which("claude.cmd")
        or shutil.which("claude")
        or os.path.expandvars(r"%APPDATA%\npm\claude.cmd")
    )
    if not claude_executable or not os.path.exists(claude_executable):
        raise ValueError("未找到 Claude Code CLI，可执行文件 claude/claude.cmd 不存在")
    command = [
        claude_executable,
        "-p",
        "--output-format",
        "text",
        "--permission-mode",
        "bypassPermissions",
        "--dangerously-skip-permissions",
        "--add-dir",
        task_dir,
    ]
    process = subprocess.Popen(
        command,
        cwd=task_dir,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    result_md_path = os.path.join(task_dir, "功能测试用例.md")
    start_time = time.time()
    stable_since = None
    stdout_text = ""
    stderr_text = ""
    try:
        if process.stdin:
            process.stdin.write(prompt_text)
            process.stdin.close()
        while True:
            return_code = process.poll()
            md_exists = os.path.exists(result_md_path)
            md_text = read_text_if_exists(result_md_path) if md_exists else ""
            if md_exists and md_text.strip():
                current_signature = (os.path.getsize(result_md_path), os.path.getmtime(result_md_path))
                if stable_since is None:
                    stable_since = (time.time(), current_signature)
                else:
                    stable_time, stable_signature = stable_since
                    if stable_signature != current_signature:
                        stable_since = (time.time(), current_signature)
                    elif time.time() - stable_time >= 8:
                        process.terminate()
                        try:
                            stdout_text, stderr_text = process.communicate(timeout=10)
                        except Exception:
                            stdout_text = ""
                            stderr_text = ""
                            process.kill()
                            try:
                                stdout_text, stderr_text = process.communicate(timeout=5)
                            except Exception:
                                pass
                        write_text(os.path.join(task_dir, "claude_stdout.log"), str(stdout_text or "").strip())
                        write_text(os.path.join(task_dir, "claude_stderr.log"), str(stderr_text or "").strip())
                        return {
                            "stdout": str(stdout_text or "").strip(),
                            "stderr": str(stderr_text or "").strip(),
                            "result_md_path": result_md_path,
                            "markdown_text": md_text,
                        }
            if return_code is not None:
                stdout_text, stderr_text = process.communicate()
                stdout_text = str(stdout_text or "").strip()
                stderr_text = str(stderr_text or "").strip()
                write_text(os.path.join(task_dir, "claude_stdout.log"), stdout_text)
                write_text(os.path.join(task_dir, "claude_stderr.log"), stderr_text)
                if return_code != 0:
                    raise ValueError(f"Claude Code CLI 执行失败: {preview_text(stderr_text or stdout_text or 'unknown error', 1200)}")
                if not md_exists:
                    raise ValueError("Claude Code CLI 执行完成，但未生成 功能测试用例.md")
                if not md_text.strip():
                    raise ValueError("Claude Code CLI 生成的 功能测试用例.md 为空")
                return {
                    "stdout": stdout_text,
                    "stderr": stderr_text,
                    "result_md_path": result_md_path,
                    "markdown_text": md_text,
                }
            if time.time() - start_time > 1800:
                process.kill()
                try:
                    stdout_text, stderr_text = process.communicate(timeout=5)
                except Exception:
                    stdout_text = ""
                    stderr_text = ""
                write_text(os.path.join(task_dir, "claude_stdout.log"), str(stdout_text or "").strip())
                write_text(os.path.join(task_dir, "claude_stderr.log"), str(stderr_text or "").strip())
                raise ValueError("Claude Code CLI 执行超时，30分钟内未完成")
            time.sleep(2)
    finally:
        if process.poll() is None:
            try:
                process.kill()
            except Exception:
                pass


async def load_skill_docs(session, user_id, doc_ids):
    if not doc_ids:
        return []
    result = await session.execute(
        select(PityFunctionalCaseSkillDoc).where(
            PityFunctionalCaseSkillDoc.id.in_(doc_ids),
            PityFunctionalCaseSkillDoc.deleted_at == 0,
        )
    )
    records = result.scalars().all()
    visible_docs = []
    for item in records:
        if item.create_user == user_id or int(item.is_shared or 0) == 1:
            visible_docs.append({
                "id": item.id,
                "title": item.title,
                "doc_type": item.doc_type,
                "content": item.content,
            })
    return visible_docs


def load_task_request_payload(task, task_dir):
    payload = {}
    try:
        payload = json.loads(task.input_payload or "{}")
        if not isinstance(payload, dict):
            payload = {}
    except Exception:
        payload = {}
    request_payload_path = str(payload.get("request_payload_path") or "").strip()
    if request_payload_path and os.path.exists(request_payload_path):
        try:
            file_payload = json.loads(read_text_if_exists(request_payload_path) or "{}")
            if isinstance(file_payload, dict):
                payload.update(file_payload)
        except Exception:
            pass
    payload.setdefault("project_id", task.project_id)
    payload.setdefault("title", task.title)
    payload.setdefault("requirement_text", task.requirement_text or "")
    payload.setdefault("instruction_text", task.instruction_text or "")
    payload.setdefault("images", [])
    try:
        selected_doc_ids = json.loads(task.selected_doc_ids or "[]")
        if isinstance(selected_doc_ids, list):
            payload.setdefault("doc_ids", selected_doc_ids)
    except Exception:
        pass
    payload.setdefault("doc_ids", [])
    return payload


async def execute_skill_task(task_id):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillTask).where(
                PityFunctionalCaseSkillTask.id == task_id,
                PityFunctionalCaseSkillTask.deleted_at == 0,
            )
        )
        task = result.scalars().first()
        if task is None:
            return
        user_id = task.create_user
        task_dir = task.runtime_dir or os.path.join(SKILL_TASK_DIR, str(user_id), str(task.id))
        if not task.runtime_dir:
            task.runtime_dir = task_dir
            await session.commit()
        task_payload = load_task_request_payload(task, task_dir)
        docs = await load_skill_docs(session, user_id, task_payload.get("doc_ids") or [])

    try:
        await update_task_state(task_id, user_id, status="running", stage="prepare", stage_text="正在组装需求目录与技能材料", progress=10)
        export_runtime_materials(task_dir, task_payload.get("requirement_text"), task_payload.get("instruction_text"), task_payload.get("images"), docs)

        await update_task_state(task_id, user_id, stage="generate", stage_text="正在调用 Claude Code CLI 生成测试用例", progress=35, review_provider="claude-code-cli")
        loop = asyncio.get_running_loop()
        cli_result = await loop.run_in_executor(None, run_claude_code_generate, task_dir, task_payload, docs)

        await update_task_state(task_id, user_id, stage="convert", stage_text="正在解析 Markdown 并转换画布数据", progress=80, review_provider="claude-code-cli", review_rounds=1)
        case_title, case_data = parse_markdown_case_tree(cli_result.get("markdown_text"), task_payload.get("title") or "功能用例")
        stats = analyze_case_data(case_data)
        result_json_path = os.path.join(task_dir, "generated_case.json")
        result_md_path = cli_result.get("result_md_path") or os.path.join(task_dir, "功能测试用例.md")
        write_text(result_json_path, json.dumps(case_data, ensure_ascii=False, indent=2))

        await update_task_state(
            task_id,
            user_id,
            status="success",
            stage="success",
            stage_text="生成完成，结果已可回填画布",
            progress=100,
            result_title=case_title,
            result_case_count=int(stats["case_count"] or 0),
            result_file_path=result_json_path,
            result_md_path=result_md_path,
            result_xmind_path="",
            result_payload=json.dumps({
                "title": case_title,
                "data": case_data,
                "case_count": int(stats["case_count"] or 0),
                "case_num": int(stats["case_count"] or 0),
            }, ensure_ascii=False),
            error_message="",
            finished_at=int(time.time()),
            review_provider="claude-code-cli",
            review_rounds=1,
        )
    except Exception as exc:
        logger.error(f"functional skill task failed: {exc}")
        await update_task_state(
            task_id,
            user_id,
            status="failed",
            stage="failed",
            stage_text="生成失败",
            progress=100,
            error_message=str(exc),
            finished_at=int(time.time()),
            review_provider="claude-code-cli",
        )


async def try_finalize_task_from_runtime(task_id, user_id):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillTask).where(
                PityFunctionalCaseSkillTask.id == task_id,
                PityFunctionalCaseSkillTask.deleted_at == 0,
            )
        )
        task = result.scalars().first()
        if task is None:
            return None
        if task.create_user != user_id:
            return task
        if task.status == "success":
            return task
        task_dir = task.runtime_dir or os.path.join(SKILL_TASK_DIR, str(task.create_user), str(task.id))
        result_md_path = os.path.join(task_dir, "功能测试用例.md")
        if not os.path.exists(result_md_path):
            return task
        markdown_text = read_text_if_exists(result_md_path)
        if not markdown_text.strip():
            return task
        if time.time() - os.path.getmtime(result_md_path) < 8:
            return task
        task_payload = load_task_request_payload(task, task_dir)
    try:
        case_title, case_data = parse_markdown_case_tree(markdown_text, task_payload.get("title") or task.title or "功能用例")
        stats = analyze_case_data(case_data)
        result_json_path = os.path.join(task_dir, "generated_case.json")
        write_text(result_json_path, json.dumps(case_data, ensure_ascii=False, indent=2))
        updated_task = await update_task_state(
            task_id,
            user_id,
            status="success",
            stage="success",
            stage_text="检测到 Markdown 已生成并稳定，已自动完成画布回填",
            progress=100,
            result_title=case_title,
            result_case_count=int(stats["case_count"] or 0),
            result_file_path=result_json_path,
            result_md_path=result_md_path,
            result_xmind_path="",
            result_payload=json.dumps({
                "title": case_title,
                "data": case_data,
                "case_count": int(stats["case_count"] or 0),
                "case_num": int(stats["case_count"] or 0),
            }, ensure_ascii=False),
            error_message="",
            finished_at=int(time.time()),
            review_provider="claude-code-cli",
            review_rounds=1,
        )
        return updated_task
    except Exception as exc:
        logger.warning(f"fallback finalize skipped: {exc}")
        return task


def build_task_result(task):
    payload = {}
    logs = []
    if task.result_payload:
        try:
            payload = json.loads(task.result_payload)
        except Exception:
            payload = {}
    if task.task_logs:
        try:
            logs = json.loads(task.task_logs)
            if not isinstance(logs, list):
                logs = []
        except Exception:
            logs = []
    payload.update({
        "task_id": task.id,
        "status": task.status,
        "stage": task.stage,
        "stage_text": task.stage_text,
        "progress": task.progress,
        "review_provider": task.review_provider,
        "review_rounds": task.review_rounds,
        "error_message": task.error_message,
        "result_md_path": task.result_md_path,
        "result_xmind_path": task.result_xmind_path,
        "result_md_url": file_path_to_static_url(task.result_md_path),
        "result_xmind_url": file_path_to_static_url(task.result_xmind_path),
        "task_logs": logs,
    })
    return payload


async def update_task_state(task_id, user_id=None, **fields):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillTask).where(
                PityFunctionalCaseSkillTask.id == task_id,
                PityFunctionalCaseSkillTask.deleted_at == 0,
            )
        )
        task = result.scalars().first()
        if task is None:
            return None
        stage = fields.get("stage", task.stage)
        stage_text = fields.get("stage_text")
        for key, value in fields.items():
            setattr(task, key, value)
        append_task_log(task, stage, stage_text)
        if user_id is not None:
            task.update_user = user_id
        task.updated_at = datetime.now()
        await session.commit()
        await session.refresh(task)
        return task


@router.get("/skill-doc/list")
async def list_skill_docs(title: str = "", user_info=Depends(Permission())):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillDoc).where(PityFunctionalCaseSkillDoc.deleted_at == 0)
        )
        docs = result.scalars().all()
        user_ids = list({item.create_user for item in docs})
        user_result = await session.execute(select(User).where(User.id.in_(user_ids))) if user_ids else None
        user_name_map = {item.id: pick_user_name(item) for item in user_result.scalars().all()} if user_result else {}
        data = []
        for item in docs:
            if item.create_user != user_info["id"] and int(item.is_shared or 0) != 1:
                continue
            if title and title not in (item.title or "") and title not in (item.description or ""):
                continue
            row = serialize_model(item)
            row["owner_name"] = user_name_map.get(item.create_user, "")
            data.append(row)
    data.sort(key=lambda item: (0 if item["create_user"] == user_info["id"] else 1, -(item["id"] or 0)))
    return PityResponse.success(data)


@router.post("/skill-doc/insert")
async def insert_skill_doc(form: FunctionalCaseSkillDocForm, user_info=Depends(Permission())):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        duplicate_result = await session.execute(
            select(PityFunctionalCaseSkillDoc).where(
                PityFunctionalCaseSkillDoc.deleted_at == 0,
                PityFunctionalCaseSkillDoc.create_user == user_info["id"],
                PityFunctionalCaseSkillDoc.title == form.title,
            )
        )
        if duplicate_result.scalars().first() is not None:
            return PityResponse.failed("文档名称已存在，请更换后重试")
        model = PityFunctionalCaseSkillDoc(
            title=form.title,
            description=form.description,
            doc_type=form.doc_type,
            content=form.content,
            is_shared=form.is_shared,
            user=user_info["id"],
        )
        session.add(model)
        await session.commit()
        await session.refresh(model)
    data = serialize_model(model)
    data["owner_name"] = (user_info.get("name") or user_info.get("username") or "").strip()
    return PityResponse.success(data)


@router.post("/skill-doc/update")
async def update_skill_doc(form: FunctionalCaseSkillDocForm, user_info=Depends(Permission())):
    if not form.id:
        return PityResponse.failed("id不能为空")
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillDoc).where(
                PityFunctionalCaseSkillDoc.id == form.id,
                PityFunctionalCaseSkillDoc.deleted_at == 0,
            )
        )
        model = result.scalars().first()
        if model is None:
            return PityResponse.failed("文档不存在")
        if model.create_user != user_info["id"]:
            return PityResponse.failed("只能编辑自己的文档")
        duplicate_result = await session.execute(
            select(PityFunctionalCaseSkillDoc).where(
                PityFunctionalCaseSkillDoc.deleted_at == 0,
                PityFunctionalCaseSkillDoc.create_user == user_info["id"],
                PityFunctionalCaseSkillDoc.title == form.title,
                PityFunctionalCaseSkillDoc.id != form.id,
            )
        )
        if duplicate_result.scalars().first() is not None:
            return PityResponse.failed("文档名称已存在，请更换后重试")
        model.title = form.title
        model.description = form.description
        model.doc_type = form.doc_type
        model.content = form.content
        model.is_shared = form.is_shared
        model.update_user = user_info["id"]
        model.updated_at = datetime.now()
        await session.commit()
        await session.refresh(model)
    return PityResponse.success(serialize_model(model))


@router.get("/skill-doc/delete")
async def delete_skill_doc(id: int, user_info=Depends(Permission())):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillDoc).where(
                PityFunctionalCaseSkillDoc.id == id,
                PityFunctionalCaseSkillDoc.deleted_at == 0,
            )
        )
        model = result.scalars().first()
        if model is None:
            return PityResponse.failed("文档不存在")
        if model.create_user != user_info["id"]:
            return PityResponse.failed("只能删除自己的文档")
        model.deleted_at = int(datetime.now().timestamp())
        model.update_user = user_info["id"]
        model.updated_at = datetime.now()
        await session.commit()
    return PityResponse.success()


@router.post("/skill-task/create")
async def create_skill_task(form: FunctionalCaseSkillTaskForm, user_info=Depends(Permission())):
    if not form.requirement_text and not form.instruction_text and not form.images:
        return PityResponse.failed("请至少提供需求文档内容、生成提示词或需求截图")
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        docs = await load_skill_docs(session, user_info["id"], form.doc_ids)
        task = PityFunctionalCaseSkillTask(
            project_id=form.project_id,
            title=form.title,
            user=user_info["id"],
            requirement_text=form.requirement_text,
            instruction_text=form.instruction_text,
            selected_doc_ids=json.dumps(form.doc_ids, ensure_ascii=False),
        )
        task.status = "queued"
        task.stage = "queued"
        task.stage_text = "任务已创建，等待后台执行"
        task.progress = 0
        task.task_logs = json.dumps([{
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "stage": "queued",
            "text": "任务已创建，等待后台执行",
        }], ensure_ascii=False)
        task.input_payload = json.dumps({
            "project_id": form.project_id,
            "title": form.title,
            "doc_ids": form.doc_ids,
            "visible_doc_count": len(docs),
            "image_count": len(form.images or []),
        }, ensure_ascii=False)
        session.add(task)
        await session.commit()
        await session.refresh(task)

        task_dir = os.path.join(SKILL_TASK_DIR, str(user_info["id"]), str(task.id))
        ensure_dir(task_dir)
        request_payload_path = os.path.join(task_dir, "request_payload.json")
        write_text(request_payload_path, json.dumps({
            "project_id": form.project_id,
            "title": form.title,
            "requirement_text": form.requirement_text,
            "instruction_text": form.instruction_text,
            "images": form.images,
            "doc_ids": form.doc_ids,
            "visible_doc_count": len(docs),
        }, ensure_ascii=False))
        task.runtime_dir = task_dir
        task.input_payload = json.dumps({
            "project_id": form.project_id,
            "title": form.title,
            "doc_ids": form.doc_ids,
            "visible_doc_count": len(docs),
            "image_count": len(form.images or []),
            "request_payload_path": request_payload_path,
        }, ensure_ascii=False)
        await session.commit()
    asyncio.create_task(execute_skill_task(task.id))
    return PityResponse.success({"task_id": task.id, "status": task.status, "stage": task.stage, "progress": task.progress})


@router.get("/skill-task/status")
async def query_skill_task_status(id: int, user_info=Depends(Permission())):
    async with async_session() as session:
        await ensure_skill_task_schema(session)
        result = await session.execute(
            select(PityFunctionalCaseSkillTask).where(
                PityFunctionalCaseSkillTask.id == id,
                PityFunctionalCaseSkillTask.deleted_at == 0,
            )
        )
        task = result.scalars().first()
        if task is None:
            return PityResponse.failed("任务不存在")
        if task.create_user != user_info["id"]:
            return PityResponse.failed("只能查看自己的任务")
    task = await try_finalize_task_from_runtime(id, user_info["id"]) or task
    return PityResponse.success(build_task_result(task))
