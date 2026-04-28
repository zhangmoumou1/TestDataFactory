from typing import Any, Dict, List, Optional

from pydantic.v1 import BaseModel, validator


class FunctionalCaseDirectoryForm(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    parent: Optional[int] = None
    sort_index: int = 0

    @validator("name")
    def validate_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("目录名称不能为空")
        return value


class FunctionalCaseFileForm(BaseModel):
    id: Optional[int] = None
    project_id: int
    title: str
    directory_id: int
    data: Dict[str, Any]
    sort_index: int = 0

    @validator("title")
    def validate_title(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("用例名称不能为空")
        return value


class FunctionalCaseDirectoryMoveForm(BaseModel):
    id: int
    project_id: int
    parent: Optional[int] = None
    sort_index: int = 0


class FunctionalCaseFileMoveForm(BaseModel):
    id: int
    project_id: int
    directory_id: int
    sort_index: int = 0


class FunctionalCaseAIGenerateForm(BaseModel):
    project_id: int
    title: str
    requirement_text: Optional[str] = ""
    instruction_text: Optional[str] = ""
    images: List[str] = []

    @validator("title")
    def validate_ai_title(cls, value):
        value = (value or "").strip()
        if not value:
            raise ValueError("用例名称不能为空")
        return value

    @validator("requirement_text", "instruction_text", pre=True, always=True)
    def normalize_text(cls, value):
        return (value or "").strip()

    @validator("images", pre=True, always=True)
    def normalize_images(cls, value):
        if not value:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        return []


class FunctionalCaseSkillDocForm(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = ""
    doc_type: str = "skill_md"
    content: str
    is_shared: int = 1

    @validator("title", "content")
    def validate_required_text(cls, value):
        value = str(value or "").strip()
        if not value:
            raise ValueError("字段不能为空")
        return value

    @validator("description", pre=True, always=True)
    def normalize_description(cls, value):
        return str(value or "").strip()

    @validator("doc_type")
    def validate_doc_type(cls, value):
        doc_type = str(value or "").strip()
        if doc_type not in {"skill_md", "normal_md"}:
            raise ValueError("文档类型不支持")
        return doc_type

    @validator("is_shared", pre=True, always=True)
    def normalize_shared(cls, value):
        return 1 if str(value).strip() in {"1", "true", "True"} or value is True else 0


class FunctionalCaseSkillTaskForm(BaseModel):
    project_id: int
    title: str
    requirement_text: Optional[str] = ""
    instruction_text: Optional[str] = ""
    images: List[str] = []
    doc_ids: List[int] = []

    @validator("title")
    def validate_task_title(cls, value):
        value = str(value or "").strip()
        if not value:
            raise ValueError("用例名称不能为空")
        return value

    @validator("requirement_text", "instruction_text", pre=True, always=True)
    def normalize_task_text(cls, value):
        return str(value or "").strip()

    @validator("images", pre=True, always=True)
    def normalize_task_images(cls, value):
        if not value:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        return []

    @validator("doc_ids", pre=True, always=True)
    def normalize_doc_ids(cls, value):
        if not value:
            return []
        if isinstance(value, list):
            ans = []
            for item in value:
                try:
                    ans.append(int(item))
                except Exception:
                    continue
            return ans
        return []

