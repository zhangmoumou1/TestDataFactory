import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  Menu,
  Modal,
  Popconfirm,
  Progress,
  Steps,
  Select,
  Slider,
  Spin,
  Tooltip,
  Tree,
  TreeSelect,
  Upload,
  message,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { connect, history } from '@umijs/max';
import JSZip from 'jszip';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  BorderOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FormatPainterOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  LinkOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  LeftOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileOutlined,
  StarOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { FolderCode, Switch } from '@icon-park/react';
import MindMap from 'simple-mind-map';
import MindMapAssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine';
import MindMapExport from 'simple-mind-map/src/plugins/Export';
import MindMapExportXMind from 'simple-mind-map/src/plugins/ExportXMind';
import MindMapFormula from 'simple-mind-map/src/plugins/Formula';
import MindMapSelect from 'simple-mind-map/src/plugins/Select';
import 'simple-mind-map/dist/simpleMindMap.esm.min.css';
import {
  deleteFunctionalCaseDirectory,
  deleteFunctionalCaseFile,
  insertFunctionalCaseDirectory,
  insertFunctionalCaseFile,
  listFunctionalCaseDirectory,
  listFunctionalCaseFiles,
  listFunctionalCaseSkillDocs,
  moveFunctionalCaseDirectory,
  moveFunctionalCaseFile,
  queryFunctionalCaseFile,
  aiGenerateFunctionalCase,
  createFunctionalCaseSkillTask,
  queryFunctionalCaseSkillTask,
  updateFunctionalCaseDirectory,
  updateFunctionalCaseFile,
} from '@/services/functionalCase';
import CONFIG from '@/consts/config';
import './FunctionalCase.less';

const { Option } = Select;

const registerMindMapPlugin = (flag, plugin) => {
  if (!MindMap[flag]) {
    MindMap['usePlugin']?.(plugin);
    MindMap[flag] = true;
  }
};

registerMindMapPlugin('functionalCaseSelectPluginRegistered', MindMapSelect);
registerMindMapPlugin('functionalCaseExportPluginRegistered', MindMapExport);
registerMindMapPlugin('functionalCaseExportXMindPluginRegistered', MindMapExportXMind);
registerMindMapPlugin('functionalCaseFormulaPluginRegistered', MindMapFormula);
registerMindMapPlugin('functionalCaseAssociativeLinePluginRegistered', MindMapAssociativeLine);

const buildThemeConfig = (backgroundColor, lineColor, rootFill, secondFill, secondColor) => ({
  backgroundColor,
  lineColor,
  root: { fillColor: rootFill, color: '#fff', borderColor: rootFill },
  second: { fillColor: secondFill, color: secondColor, borderColor: lineColor },
  node: { fillColor: '#fff', color: secondColor, borderColor: '#d8e3f4' },
});

const THEME_CATEGORY_TABS = [
  { key: 'classic', label: '经典' },
  { key: 'dark', label: '深色' },
  { key: 'plain', label: '朴素' },
];

const THEME_PRESETS = [
  { category: 'classic', label: '默认主题', value: 'classic-default', config: buildThemeConfig('#fbfefc', '#5aa37a', '#16834a', '#ecfdf3', '#173c2a') },
  { category: 'classic', label: '脑图经典15', value: 'classic-15', config: buildThemeConfig('#e9f6fb', '#6f7dc5', '#32407f', '#f6cf6f', '#3f4f8f') },
  { category: 'classic', label: '脑图经典14', value: 'classic-14', config: buildThemeConfig('#efe3c9', '#b88756', '#0f8f84', '#edd0a6', '#7f5837') },
  { category: 'classic', label: '脑图经典13', value: 'classic-13', config: buildThemeConfig('#f7f7f7', '#5f6f85', '#f5cc21', '#d5e7f0', '#3b4f63') },
  { category: 'classic', label: '脑图经典12', value: 'classic-12', config: buildThemeConfig('#ecfcf4', '#58b89d', '#2acb93', '#ecfff4', '#1d6c5a') },
  { category: 'dark', label: '深海夜色', value: 'dark-ocean', config: buildThemeConfig('#1b2533', '#5e9cff', '#0b4a9e', '#253347', '#d8e7ff') },
  { category: 'dark', label: '深空紫', value: 'dark-purple', config: buildThemeConfig('#221d2f', '#9b8cff', '#5a3cbe', '#2f2842', '#e5dcff') },
  { category: 'dark', label: '石墨黑金', value: 'dark-gold', config: buildThemeConfig('#242422', '#bca66b', '#6d5a29', '#322f28', '#f4ebd2') },
  { category: 'dark', label: '夜幕青绿', value: 'dark-green', config: buildThemeConfig('#152621', '#58b89d', '#166f62', '#20362f', '#d9f5eb') },
  { category: 'plain', label: '简约灰', value: 'plain-gray', config: buildThemeConfig('#f7f9fc', '#94a3b8', '#64748b', '#ecf1f7', '#334155') },
  { category: 'plain', label: '雾霾蓝', value: 'plain-blue', config: buildThemeConfig('#f3f7ff', '#7da3de', '#4f79bb', '#e9f0fd', '#2f4f85') },
  { category: 'plain', label: '浅草绿', value: 'plain-green', config: buildThemeConfig('#f3fdf7', '#7dbb8e', '#4f9972', '#e8faef', '#2d6347') },
  { category: 'plain', label: '暖米杏', value: 'plain-beige', config: buildThemeConfig('#fff8ef', '#caa674', '#b28554', '#f9eddc', '#6f4f2f') },
];

const FORMAT_BRUSH_STYLE_KEYS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textDecoration',
  'textAlign',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'fillColor',
  'shape',
  'lineColor',
  'lineWidth',
  'lineStyle',
  'paddingX',
  'paddingY',
];

const PRIORITY_COLORS = ['#f04438', '#f79009', '#2563eb', '#667085', '#667085', '#667085', '#667085', '#667085', '#667085', '#667085'];
const MAX_NODE_ICONS = 6;
const XMIND_TASK_MARKERS = ['task-start', 'task-oct', 'task-quarter', 'task-3oct', 'task-half', 'task-5oct', 'task-3quar', 'task-7oct', 'task-done'];
const UNSAVED_CASE_CLOSE_TEXT = '你有未保存用例，是否关闭窗口';

const escapeSvgText = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const circleIconSvg = (text, fill, color = '#fff') => (
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${fill}"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" font-weight="700" fill="${color}">${escapeSvgText(text)}</text></svg>`
);

const progressIconSvg = (step) => {
  const safeStep = Math.max(1, Math.min(8, step));
  if (safeStep >= 8) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b943" stroke="#10b943" stroke-width="2"/><path d="M7.7 12.3l2.5 2.5 6-6.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const angle = (safeStep / 8) * 359.9;
  const radians = (angle - 90) * (Math.PI / 180);
  const x = 12 + 10 * Math.cos(radians);
  const y = 12 + 10 * Math.sin(radians);
  const largeArc = angle > 180 ? 1 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff" stroke="#10b943" stroke-width="2"/><path d="M12 12 L12 2 A10 10 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="#10b943"/><circle cx="12" cy="12" r="10" fill="none" stroke="#10b943" stroke-width="2"/></svg>`;
};

const squareIconSvg = (text, fill, color = '#1f2937') => (
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="${fill}"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" font-weight="700" fill="${color}">${escapeSvgText(text)}</text></svg>`
);

const buildIconItem = (type, name, label, icon) => ({
  name,
  label,
  value: `${type}_${name}`,
  icon,
});

const ICON_GROUPS = [
  {
    label: '优先级图标',
    type: 'priority',
    items: Array.from({ length: 10 }, (_, index) => {
      const level = index + 1;
      return buildIconItem('priority', String(level), `优先级${level}`, circleIconSvg(level, PRIORITY_COLORS[index]));
    }),
  },
  {
    label: '进度图标',
    type: 'progress',
    items: Array.from({ length: 8 }, (_, index) => {
      const step = index + 1;
      return buildIconItem('progress', String(step), `进度${step}/8`, progressIconSvg(step));
    }),
  },
  {
    label: '标记图标',
    type: 'mark',
    items: [
      buildIconItem('mark', 'done', '完成', circleIconSvg('✓', '#16a34a')),
      buildIconItem('mark', 'error', '错误', circleIconSvg('×', '#ef4444')),
      buildIconItem('mark', 'star', '星标', circleIconSvg('★', '#f59e0b')),
      buildIconItem('mark', 'info', '提示', circleIconSvg('!', '#3b82f6')),
      buildIconItem('mark', 'question', '疑问', circleIconSvg('?', '#64748b')),
      buildIconItem('mark', 'warn', '风险', circleIconSvg('!', '#f97316')),
      buildIconItem('mark', 'flag', '旗标', squareIconSvg('⚑', '#fee2e2', '#dc2626')),
      buildIconItem('mark', 'lock', '锁定', squareIconSvg('🔒', '#e2e8f0', '#334155')),
      buildIconItem('mark', 'thumb', '点赞', squareIconSvg('👍', '#dcfce7', '#15803d')),
      buildIconItem('mark', 'phone', '电话', squareIconSvg('☎', '#dbeafe', '#2563eb')),
    ],
  },
  {
    label: '彩色贴纸',
    type: 'sticker',
    items: [
      buildIconItem('sticker', 'heart', '爱心', circleIconSvg('♥', '#fb7185')),
      buildIconItem('sticker', 'fire', '火焰', circleIconSvg('🔥', '#f97316')),
      buildIconItem('sticker', 'bell', '提醒', circleIconSvg('🔔', '#facc15', '#7c2d12')),
      buildIconItem('sticker', 'chat', '沟通', circleIconSvg('…', '#38bdf8')),
      buildIconItem('sticker', 'gift', '礼物', circleIconSvg('🎁', '#a855f7')),
      buildIconItem('sticker', 'trophy', '奖杯', circleIconSvg('🏆', '#f59e0b')),
      buildIconItem('sticker', 'user', '人员', circleIconSvg('人', '#94a3b8')),
      buildIconItem('sticker', 'group', '团队', circleIconSvg('群', '#64748b')),
      buildIconItem('sticker', 'bug', '缺陷', circleIconSvg('虫', '#22c55e')),
      buildIconItem('sticker', 'test', '验证', circleIconSvg('测', '#06b6d4')),
    ],
  },
];

const MIND_ICON_LIST = ICON_GROUPS.map((group) => ({
  name: group.label,
  type: group.type,
  list: group.items.map((item) => ({
    name: item.name,
    icon: item.icon,
  })),
}));

const ICON_ITEM_MAP = ICON_GROUPS.reduce((map, group) => {
  group.items.forEach((item) => {
    map[item.value] = item;
  });
  return map;
}, {});

const ICON_LABEL_VALUE_MAP = ICON_GROUPS.reduce((map, group) => {
  group.items.forEach((item) => {
    if (!map[item.label]) {
      map[item.label] = [];
    }
    map[item.label].push(item.value);
  });
  return map;
}, {});

const getTagLabelText = (item) => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    const candidate = item.text || item.title || item.label || item.name || item.value || '';
    return String(candidate).trim();
  }
  return '';
};

const SHAPE_OPTIONS = [
  { label: '矩形', value: 'rectangle' },
  { label: '圆角矩形', value: 'roundedRectangle' },
  { label: '菱形', value: 'diamond' },
  { label: '圆', value: 'circle' },
  { label: '平行四边形', value: 'parallelogram' },
  { label: '八角矩形', value: 'octagonalRectangle' },
];

const COLOR_SWATCHES = [
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#94a3b8',
  '#1f2937',
  '#0f172a',
  '#020617',
  '#dbeafe',
  '#bfdbfe',
  '#60a5fa',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#d1fae5',
  '#a7f3d0',
  '#34d399',
  '#059669',
  '#047857',
  '#064e3b',
  '#ecfeff',
  '#a5f3fc',
  '#06b6d4',
  '#0e7490',
  '#f0fdf4',
  '#86efac',
  '#22c55e',
  '#15803d',
  '#fef3c7',
  '#fef9c3',
  '#fde047',
  '#ca8a04',
  '#f59e0b',
  '#b45309',
  '#7c2d12',
  '#fee2e2',
  '#f87171',
  '#dc2626',
  '#b91c1c',
  '#7f1d1d',
  '#fff1f2',
  '#fda4af',
  '#e11d48',
  '#9f1239',
  '#fae8ff',
  '#f3e8ff',
  '#c4b5fd',
  '#8b5cf6',
  '#6d28d9',
  '#ede9fe',
  '#a5b4fc',
  '#6366f1',
  '#4338ca',
  '#d946ef',
  '#a21caf',
];

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32];

const LINE_STYLE_OPTIONS = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'curve' },
  { label: '直连', value: 'direct' },
];

const FONT_FAMILY_OPTIONS = [
  { label: '微软雅黑', value: '微软雅黑, Microsoft YaHei' },
  { label: '宋体', value: 'SimSun, 宋体' },
  { label: '黑体', value: 'SimHei, 黑体' },
  { label: 'Arial', value: 'Arial' },
];

const LAYOUT_GROUPS = [
  {
    title: '逻辑结构图',
    items: [
      { label: '向右逻辑', value: 'logicalStructure', preview: 'logic-right' },
      { label: '向左逻辑', value: 'logicalStructureLeft', preview: 'logic-left' },
    ],
  },
  {
    title: '思维导图',
    items: [{ label: '左右展开', value: 'mindMap', preview: 'mind-map' }],
  },
  {
    title: '组织结构图',
    items: [{ label: '组织结构', value: 'organizationStructure', preview: 'organization' }],
  },
  {
    title: '目录组织图',
    items: [{ label: '目录组织', value: 'catalogOrganization', preview: 'catalog' }],
  },
  {
    title: '时间轴',
    items: [
      { label: '时间轴1', value: 'timeline', preview: 'timeline-a' },
      { label: '时间轴2', value: 'timeline2', preview: 'timeline-b' },
      { label: '垂直时间轴', value: 'verticalTimeline', preview: 'timeline-c' },
    ],
  },
  {
    title: '鱼骨图',
    items: [{ label: '鱼骨图', value: 'fishbone', preview: 'fishbone' }],
  },
];

const SIDE_PANELS = [
  { key: 'node', label: '节点样式', icon: <StarOutlined /> },
  { key: 'base', label: '基础样式', icon: <HighlightOutlined /> },
  { key: 'theme', label: '主题', icon: <BgColorsOutlined /> },
  { key: 'structure', label: '结构', icon: <ApartmentOutlined /> },
  { key: 'outline', label: '大纲', icon: <AppstoreOutlined /> },
  { key: 'setting', label: '设置', icon: <SettingOutlined /> },
];

const EXPORT_OPTIONS = [
  {
    key: 'png',
    label: '图片',
    format: '.png',
    description: 'PNG图片格式',
    option: '高清图片',
    icon: <PictureOutlined />,
  },
  {
    key: 'xmind',
    label: 'XMind',
    format: '.xmind',
    description: 'XMind软件格式（自定义样式兼容有限）',
    option: '保留结构，通用图标转为 XMind 可读标记',
    icon: <ExportOutlined />,
  },
  {
    key: 'markdown',
    label: 'Markdown',
    format: '.md',
    description: 'Markdown文本格式',
    option: '保留层级结构',
    icon: <FileTextOutlined />,
  },
];

const AI_UPLOAD_ACCEPT = '.png,.jpg,.jpeg,.webp,.bmp';

const defaultCaseData = (title) => ({
  data: {
    text: title || '功能用例',
  },
  children: [],
});

const isFullMindData = (data) => Boolean(data && typeof data === 'object' && data.root && data.root.data);

const getMindRootData = (data) => (isFullMindData(data) ? data.root : data);

const cloneMindData = (data) => {
  if (!data || typeof data !== 'object') return data;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    return data;
  }
};

const normalizeNodeIcons = (icons) => {
  const rawIcons = Array.isArray(icons) ? icons : [icons].filter(Boolean);
  const priorityIcon = rawIcons.find((icon) => /^priority_\d+$/.test(icon));
  const progressIcon = rawIcons.find((icon) => /^progress_\d+$/.test(icon));
  const otherIcons = rawIcons.filter((icon) => icon !== priorityIcon && icon !== progressIcon);
  return [priorityIcon, progressIcon, ...otherIcons].filter(Boolean).slice(0, MAX_NODE_ICONS);
};

const restoreIconsFromTags = (nodeData = {}) => {
  const rawTags = Array.isArray(nodeData.tag) ? nodeData.tag : [nodeData.tag].filter(Boolean);
  if (rawTags.length === 0) return;
  const remainTags = [];
  const tagIcons = [];
  rawTags.forEach((item) => {
    const label = getTagLabelText(item);
    const mapped = ICON_LABEL_VALUE_MAP[label];
    if (mapped?.length) {
      tagIcons.push(...mapped);
      return;
    }
    remainTags.push(item);
  });
  if (tagIcons.length > 0) {
    const rawIcons = Array.isArray(nodeData.icon) ? nodeData.icon : [nodeData.icon].filter(Boolean);
    nodeData.icon = normalizeNodeIcons([...rawIcons, ...tagIcons]);
  }
  if (remainTags.length === 0) {
    delete nodeData.tag;
  } else {
    nodeData.tag = remainTags;
  }
};

const normalizeMindNodeIcons = (node) => {
  if (!node?.data) return;
  if (node.data.richText || /<[^>]+>/.test(String(node.data.text || ''))) {
    node.data.text = stripHtmlText(node.data.text);
  }
  delete node.data.richText;
  delete node.data.resetRichText;
  delete node.data.customTextWidth;
  restoreIconsFromTags(node.data);
  if (node.data.icon) {
    node.data.icon = normalizeNodeIcons(node.data.icon);
  }
  (node.children || []).forEach(normalizeMindNodeIcons);
};

const sanitizeMindData = (data, fallbackTitle = '') => {
  if (!data || typeof data !== 'object') return data;
  const cloned = cloneMindData(data);
  const root = getMindRootData(cloned);
  if (root?.data) {
    root.data.text = String(root.data.text || fallbackTitle || '功能用例').trim() || fallbackTitle || '功能用例';
  }
  normalizeMindNodeIcons(root);
  if (isFullMindData(cloned)) {
    delete cloned.view;
  }
  return cloned;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`读取文件「${file?.name || '未命名图片'}」失败`));
    reader.readAsDataURL(file);
  });

const stripHtmlText = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const getXMindMarkers = (icons = []) => normalizeNodeIcons(icons)
  .map((icon) => {
    const priorityMatch = /^priority_(\d+)$/.exec(icon);
    if (priorityMatch) {
      return { markerId: `priority-${Math.min(9, Number(priorityMatch[1]))}` };
    }
    const progressMatch = /^progress_(\d+)$/.exec(icon);
    if (progressMatch) {
      return { markerId: XMIND_TASK_MARKERS[Math.max(0, Math.min(8, Number(progressMatch[1])))] };
    }
    return null;
  })
  .filter(Boolean);

const buildXMindTopic = (node, indexPath = '0') => {
  const data = node?.data || {};
  const topic = {
    id: data.uid || `functional_case_${indexPath}`,
    title: stripHtmlText(data.text) || '未命名节点',
    structureClass: 'org.xmind.ui.logic.right',
    children: {
      attached: [],
    },
  };
  const markers = getXMindMarkers(data.icon);
  if (markers.length > 0) {
    topic.markers = markers;
  }
  if (data.hyperlink) {
    topic.href = data.hyperlink;
  }
  if (data.note) {
    topic.notes = {
      plain: {
        content: stripHtmlText(data.note),
      },
    };
  }
  if (data.tag !== undefined) {
    topic.labels = (Array.isArray(data.tag) ? data.tag : [data.tag])
      .map((item) => (typeof item === 'object' && item !== null ? item.text : item))
      .filter(Boolean);
  }
  topic.children.attached = (node.children || []).map((child, index) => buildXMindTopic(child, `${indexPath}_${index}`));
  return topic;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const exportXMindFile = async (data, name) => {
  const id = `functional_case_${Date.now()}`;
  const root = getMindRootData(data);
  const rootTopic = buildXMindTopic(root);
  rootTopic.class = 'topic';
  const contentData = [{
    id,
    class: 'sheet',
    title: name,
    extensions: [],
    topicPositioning: 'fixed',
    topicOverlapping: 'overlap',
    coreVersion: '2.100.0',
    rootTopic,
  }];
  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(contentData));
  zip.file('metadata.json', JSON.stringify({
    modifier: '',
    dataStructureVersion: '2',
    creator: { name: 'Argux' },
    layoutEngineVersion: '3',
    activeSheetId: id,
  }));
  zip.file('manifest.json', JSON.stringify({
    'file-entries': {
      'content.json': {},
      'metadata.json': {},
      'Thumbnails/thumbnail.png': {},
    },
  }));
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${name}.xmind`);
};

const normalizeXMindExportData = (data) => {
  const cloned = cloneMindData(data);
  const root = getMindRootData(cloned);
  const walk = (node) => {
    if (!node?.data) return;
    const rawIcons = Array.isArray(node.data.icon) ? node.data.icon : [node.data.icon].filter(Boolean);
    if (rawIcons.length > 0) {
      const compatibleIcons = rawIcons.filter((icon) => /^priority_\d+$/.test(icon) || /^progress_\d+$/.test(icon));
      const labels = rawIcons
        .filter((icon) => !compatibleIcons.includes(icon))
        .map((icon) => ICON_ITEM_MAP[icon]?.label)
        .filter(Boolean);
      node.data.icon = compatibleIcons;
      if (labels.length > 0) {
        const currentTags = Array.isArray(node.data.tag) ? node.data.tag : [node.data.tag].filter(Boolean);
        node.data.tag = Array.from(new Set([...currentTags, ...labels]));
      }
    }
    (node.children || []).forEach(walk);
  };
  walk(root);
  return cloned;
};

const getNodeText = (title) => {
  if (typeof title === 'string') return title;
  return title?.props?.children || '';
};

const formatTreeTime = (value) => {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  return text.length > 16 ? text.slice(0, 16) : text;
};

const normalizeKeyword = (value) => (value || '').trim().toLowerCase();

const buildCaseTree = (directoryTree, files, keyword = '') => {
  const search = normalizeKeyword(keyword);
  const fileMap = {};
  (files || []).forEach((item) => {
    fileMap[item.directory_id] = fileMap[item.directory_id] || [];
    fileMap[item.directory_id].push(item);
  });

  const loop = (nodes) => (nodes || []).reduce((acc, item) => {
    const dirTitle = item.title || item.name || '';
    const children = loop(item.children);
    const caseNodes = (fileMap[item.id] || [])
      .filter((caseItem) => !search || (caseItem.title || '').toLowerCase().includes(search))
      .map((caseItem) => ({
        ...caseItem,
        key: `case-${caseItem.id}`,
        title: caseItem.title,
        nodeType: 'case',
        isLeaf: true,
        raw: caseItem,
      }));
    const matchedDirectory = !search || dirTitle.toLowerCase().includes(search);
    if (!matchedDirectory && children.length === 0 && caseNodes.length === 0) return acc;

    acc.push({
      ...item,
      key: `dir-${item.id}`,
      title: dirTitle,
      nodeType: 'directory',
      children: [...children, ...caseNodes],
    });
    return acc;
  }, []);

  return loop(directoryTree);
};

const treeToSelectOptions = (nodes, disabledKeys = new Set()) => (nodes || []).map((item) => ({
  title: item.title || item.name,
  label: item.title || item.name,
  value: item.id,
  key: item.id,
  disabled: disabledKeys.has(item.id),
  children: treeToSelectOptions(item.children || [], disabledKeys),
}));

const getDescendantDirectoryIds = (nodes, targetId) => {
  const find = (items) => {
    for (const item of items || []) {
      if (item.id === targetId) return item;
      const child = find(item.children);
      if (child) return child;
    }
    return null;
  };
  const target = find(nodes);
  const ids = [];
  const collect = (items) => {
    (items || []).forEach((item) => {
      ids.push(item.id);
      collect(item.children);
    });
  };
  collect(target?.children || []);
  return ids;
};

const collectOutline = (data, level = 0, list = []) => {
  if (!data) return list;
  list.push({
    key: data.data?.uid || `${level}-${list.length}`,
    level,
    text: data.data?.text || '未命名节点',
  });
  (data.children || []).forEach((child) => collectOutline(child, level + 1, list));
  return list;
};

const countMindData = (data) => {
  const outline = collectOutline(data);
  const text = outline.map((item) => item.text).join('');
  return {
    nodeCount: outline.length,
    wordCount: text.length,
  };
};

const FunctionalCase = ({ project, dispatch }) => {
  const projects = project?.projects || [];
  const projectId = project?.project_id;
  const mindRef = useRef(null);
  const mindContainerRef = useRef(null);
  const caseRenderTimerRef = useRef(null);
  const editorPanelRef = useRef(null);
  const renderFrameRef = useRef(null);
  const renderRetryRef = useRef(0);
  const dirtyCheckTimerRef = useRef(null);
  const suppressDirtyCheckRef = useRef(false);
  const savedCaseSnapshotRef = useRef('');
  const routeConfirmingRef = useRef(false);
  const tabActionBypassRef = useRef(false);
  const currentDirectoryRef = useRef(null);
  const importFileRef = useRef(null);
  const formatPainterRef = useRef({ active: false, styles: null, sourceUid: null });
  const nodeContextMenuRef = useRef(false);
  const ctrlSelectModeRef = useRef(false);
  const [directoryTree, setDirectoryTree] = useState([]);
  const [caseFiles, setCaseFiles] = useState([]);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentCase, setCurrentCase] = useState(null);
  const [caseDirty, setCaseDirty] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [directoryModal, setDirectoryModal] = useState({ open: false, record: null, parent: null });
  const [caseModal, setCaseModal] = useState({ open: false, record: null, directoryId: null });
  const [moveModal, setMoveModal] = useState({ open: false, type: '', record: null });
  const [linkModal, setLinkModal] = useState({ open: false });
  const [noteModal, setNoteModal] = useState({ open: false });
  const [imageModal, setImageModal] = useState({ open: false });
  const [attachmentModal, setAttachmentModal] = useState({ open: false });
  const [formulaModal, setFormulaModal] = useState({ open: false });
  const [exportModal, setExportModal] = useState({ open: false, type: 'png', name: '' });
  const [aiModal, setAiModal] = useState({
    open: false,
    loading: false,
    requirementText: '',
    instructionText: '',
    fileList: [],
  });
  const [skillAiModal, setSkillAiModal] = useState({
    open: false,
    loading: false,
    polling: false,
    taskId: null,
    progress: 0,
    stage: 'idle',
    stageText: '',
    errorMessage: '',
    reviewProvider: '',
    reviewRounds: 0,
    taskLogs: [],
    resultMdUrl: '',
    resultCaseCount: 0,
    requirementText: '',
    instructionText: '',
    fileList: [],
    selectedDocIds: [],
  });
  const [skillDocOptions, setSkillDocOptions] = useState([]);
  const [loadingSkillDocs, setLoadingSkillDocs] = useState(false);
  const [skillAiStep, setSkillAiStep] = useState(0);
  const [activePanel, setActivePanel] = useState('node');
  const [panelOpen, setPanelOpen] = useState(false);
  const [themeCategory, setThemeCategory] = useState('classic');
  const [activeThemeValue, setActiveThemeValue] = useState(THEME_PRESETS[0]?.value || '');
  const [activeLayoutValue, setActiveLayoutValue] = useState('logicalStructure');
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [scale, setScale] = useState(100);
  const [noteText, setNoteText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [formulaText, setFormulaText] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [moveParent, setMoveParent] = useState(null);
  const [moveDirectoryId, setMoveDirectoryId] = useState(null);
  const [moveSortIndex, setMoveSortIndex] = useState(0);
  const [nodeKey, setNodeKey] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [formatPainterSourceUid, setFormatPainterSourceUid] = useState(null);
  const [mindContextMenu, setMindContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    type: 'canvas',
    node: null,
  });
  const [styleDraft, setStyleDraft] = useState({
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 5,
    paddingX: 15,
    paddingY: 5,
    lineWidth: 2,
    themeLineWidth: 2,
    generalizationLineWidth: 2,
    associativeLineWidth: 2,
  });

  const caseTree = useMemo(
    () => buildCaseTree(directoryTree, caseFiles, appliedKeyword),
    [directoryTree, caseFiles, appliedKeyword],
  );

  useEffect(() => {
    if (!skillAiModal.open) return;
    let active = true;
    const loadSkillDocs = async () => {
      setLoadingSkillDocs(true);
      try {
        const res = await listFunctionalCaseSkillDocs({});
        if (!active) return;
        if (res?.code !== 0) {
          throw new Error(res?.msg || '获取用例技能失败');
        }
        setSkillDocOptions((res?.data || []).map((item) => ({
          label: `${item.title}${item.doc_type === 'skill_md' ? ' · 技能文档' : ' · 普通文档'}`,
          value: item.id,
        })));
      } catch (error) {
        if (active) {
          message.error(error?.message || '获取用例技能失败');
        }
      } finally {
        if (active) {
          setLoadingSkillDocs(false);
        }
      }
    };
    loadSkillDocs();
    return () => {
      active = false;
    };
  }, [skillAiModal.open]);

  useEffect(() => {
    if (!skillAiModal.open || !skillAiModal.polling || !skillAiModal.taskId) return undefined;
    let cancelled = false;
    let timer = null;

    const pollTask = async () => {
      try {
        const statusRes = await queryFunctionalCaseSkillTask({ id: skillAiModal.taskId });
        if (cancelled) return;
        if (statusRes?.code !== 0) {
          throw new Error(statusRes?.msg || '查询生成结果失败');
        }
        const data = statusRes?.data || {};
        setSkillAiModal((prev) => ({
          ...prev,
          progress: Number(data.progress || 0),
          stage: data.stage || prev.stage,
          stageText: data.stage_text || prev.stageText,
          reviewProvider: data.review_provider || '',
          reviewRounds: Number(data.review_rounds || 0),
          errorMessage: data.error_message || '',
          taskLogs: Array.isArray(data.task_logs) ? data.task_logs : [],
          resultMdUrl: data.result_md_url || '',
          resultCaseCount: Number(data.case_count || data.case_num || 0),
        }));
        if (data.status === 'success') {
          const generatedTitle = data.title || currentCase?.title || '功能用例';
          const generatedData = sanitizeMindData(data.data || defaultCaseData(generatedTitle));
          applyImportedData(generatedData, generatedTitle);
          setSkillAiModal((prev) => ({
            ...prev,
            open: true,
            loading: false,
            polling: false,
            taskId: null,
            progress: 100,
            stage: 'done',
            stageText: `已生成 ${data.case_count || data.case_num || 0} 条候选用例，当前画布已同步最新结果。`,
            errorMessage: '',
            reviewProvider: data.review_provider || prev.reviewProvider || '',
            reviewRounds: Number(data.review_rounds || prev.reviewRounds || 0),
            taskLogs: Array.isArray(data.task_logs) ? data.task_logs : prev.taskLogs,
            resultMdUrl: data.result_md_url || prev.resultMdUrl || '',
            resultCaseCount: Number(data.case_count || data.case_num || prev.resultCaseCount || 0),
          }));
          setSkillAiStep(2);
          message.success(`技能生成完成，识别到 ${data.case_count || data.case_num || 0} 条候选用例，当前画布已更新`);
          return;
        }
        if (data.status === 'failed') {
          setSkillAiModal((prev) => ({
            ...prev,
            loading: false,
            polling: false,
            errorMessage: data.error_message || '技能生成失败',
          }));
          message.error(data.error_message || '技能生成失败');
          return;
        }
        timer = setTimeout(pollTask, 2000);
      } catch (error) {
        if (cancelled) return;
        setSkillAiModal((prev) => ({
          ...prev,
          loading: false,
          polling: false,
          errorMessage: error?.message || '查询生成结果失败',
        }));
        message.error(error?.message || '查询生成结果失败');
      }
    };

    pollTask();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [skillAiModal.open, skillAiModal.polling, skillAiModal.taskId, currentCase]);

  const directoryOptions = useMemo(() => treeToSelectOptions(directoryTree), [directoryTree]);

  const selectedKeys = useMemo(() => {
    if (currentCase) return [`case-${currentCase.id}`];
    if (currentDirectory) return [`dir-${currentDirectory}`];
    return [];
  }, [currentDirectory, currentCase]);

  const outline = useMemo(() => {
    const source = getMindRootData(currentCase?.data) || defaultCaseData(currentCase?.title);
    return collectOutline(source);
  }, [currentCase]);

  const mindStats = useMemo(() => {
    const source = getMindRootData(currentCase?.data) || defaultCaseData(currentCase?.title);
    return countMindData(source);
  }, [currentCase]);

  const filteredThemePresets = useMemo(
    () => THEME_PRESETS.filter((item) => item.category === themeCategory),
    [themeCategory],
  );

  const getProject = useCallback(() => {
    if (projects.length === 0) {
      return null;
    }
    const target = projects.find((item) => item.id === projectId);
    return target || projects[0];
  }, [projects, projectId]);

  const saveProject = useCallback((nextProjectId) => {
    if (!nextProjectId) return;
    dispatch?.({
      type: 'project/save',
      payload: { project_id: nextProjectId },
    });
    localStorage.setItem('project_id', String(nextProjectId));
  }, [dispatch]);

  useEffect(() => {
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: formatPainterActive,
      sourceUid: formatPainterSourceUid,
    };
  }, [formatPainterActive, formatPainterSourceUid]);

  const closeMindContextMenu = useCallback(() => {
    setMindContextMenu((prev) => (prev.open ? { ...prev, open: false, node: null } : prev));
  }, []);

  useEffect(() => {
    const hide = () => closeMindContextMenu();
    window.addEventListener('click', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('click', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, [closeMindContextMenu]);

  const fetchTree = useCallback(async (keyword = appliedKeyword, targetProjectId = projectId) => {
    if (!targetProjectId) {
      setDirectoryTree([]);
      setCaseFiles([]);
      setCurrentDirectory(null);
      setCurrentCase(null);
      return;
    }
    setLoadingTree(true);
    try {
      const [directoryRes, fileRes] = await Promise.all([
        listFunctionalCaseDirectory({ project_id: targetProjectId }),
        listFunctionalCaseFiles({ title: keyword || '', project_id: targetProjectId }),
      ]);

      if (directoryRes?.code === 0 && fileRes?.code === 0) {
        const directories = Array.isArray(directoryRes.data) ? directoryRes.data : [];
        const files = (Array.isArray(fileRes.data) ? fileRes.data : []).map((item) => ({
          ...item,
          case_count: Number(item?.case_count ?? item?.case_num ?? 0),
          create_user_name: item?.create_user_name || item?.creator_name || '',
        }));
        setDirectoryTree(directories);
        setCaseFiles(files);
        if (!currentDirectoryRef.current && directories.length > 0) {
          setCurrentDirectory(directories[0].id);
        }
      } else {
        message.error(directoryRes?.msg || fileRes?.msg || '获取功能用例树失败');
      }
    } finally {
      setLoadingTree(false);
    }
  }, [appliedKeyword, projectId]);

  const clearRenderFrame = useCallback(() => {
    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
    if (caseRenderTimerRef.current) {
      window.clearTimeout(caseRenderTimerRef.current);
      caseRenderTimerRef.current = null;
    }
  }, []);

  const destroyMindMap = useCallback(() => {
    clearRenderFrame();
      if (mindRef.current) {
      if (typeof mindRef.current.off === 'function') {
        if (mindRef.current.__formatPainterHandler) {
          mindRef.current.off('node_active', mindRef.current.__formatPainterHandler);
        }
        if (mindRef.current.__nodeContextMenuHandler) {
          mindRef.current.off('node_contextmenu', mindRef.current.__nodeContextMenuHandler);
        }
        if (mindRef.current.__canvasContextMenuHandler) {
          mindRef.current.off('contextmenu', mindRef.current.__canvasContextMenuHandler);
        }
        if (mindRef.current.__scaleSyncHandler) {
          ['view_data_change', 'view_change', 'scale', 'translate', 'data_change'].forEach((eventName) => {
            mindRef.current.off(eventName, mindRef.current.__scaleSyncHandler);
          });
        }
        if (mindRef.current.__dirtyChangeHandler) {
          mindRef.current.off('data_change', mindRef.current.__dirtyChangeHandler);
        }
      }
      mindRef.current.destroy();
      mindRef.current = null;
    }
    if (dirtyCheckTimerRef.current) {
      window.clearTimeout(dirtyCheckTimerRef.current);
      dirtyCheckTimerRef.current = null;
    }
    closeMindContextMenu();
    setFormatPainterActive(false);
    setFormatPainterSourceUid(null);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: false,
      styles: null,
      sourceUid: null,
    };
    ctrlSelectModeRef.current = false;
  }, [clearRenderFrame, closeMindContextMenu]);

  const getMindData = useCallback(() => {
    if (!mindRef.current) return currentCase?.data;
    return mindRef.current.getData(true);
  }, [currentCase]);

  const buildCaseSnapshot = useCallback((data, fallbackTitle = '功能用例') => (
    JSON.stringify(sanitizeMindData(data || defaultCaseData(fallbackTitle), fallbackTitle))
  ), []);

  const runDirtyCheck = useCallback(() => {
    if (!mindRef.current || !currentCase || suppressDirtyCheckRef.current) return;
    const latestSnapshot = buildCaseSnapshot(getMindData(), currentCase.title || '功能用例');
    setCaseDirty(latestSnapshot !== (savedCaseSnapshotRef.current || ''));
  }, [buildCaseSnapshot, currentCase, getMindData]);

  const openUnsavedConfirm = useCallback((onOk, onCancel) => {
    Modal.confirm({
      title: '未保存提醒',
      content: UNSAVED_CASE_CLOSE_TEXT,
      okText: '关闭',
      cancelText: '取消',
      onOk,
      onCancel,
    });
  }, []);

  const syncScaleFromMind = useCallback(() => {
    const transform = mindRef.current?.draw?.transform?.();
    const view = mindRef.current?.view;
    const fullData = mindRef.current?.getData?.(true);
    const rawScale = view?.scale
      || view?.state?.scale
      || view?.transform?.scaleX
      || fullData?.view?.state?.scale
      || fullData?.view?.transform?.scaleX
      || transform?.scaleX
      || transform?.a;
    if (!rawScale || Number.isNaN(Number(rawScale))) return;
    setScale(Math.round(Number(rawScale) * 100));
  }, []);

  const refreshMindGeometry = useCallback((preserveView = true) => {
    const instance = mindRef.current;
    const el = mindContainerRef.current;
    if (!instance || !el || !el.isConnected) return;
    const rect = el.getBoundingClientRect?.();
    const width = Number(rect?.width || 0);
    const height = Number(rect?.height || 0);
    if (width <= 0 || height <= 0) return;
    const viewData = preserveView ? instance.view?.getTransformData?.() : null;
    const drawTransform = preserveView ? instance.draw?.transform?.() : null;
    try {
      instance.resize?.();
    } catch (error) {
      if (String(error?.message || '').includes('容器元素el的宽高不能为0')) {
        return;
      }
      throw error;
    }
    if (preserveView && viewData && instance.view?.setTransformData) {
      instance.view.setTransformData(viewData);
    } else if (preserveView && drawTransform) {
      instance.draw?.transform?.(drawTransform);
    }
    syncScaleFromMind();
  }, [syncScaleFromMind]);

  const handleTreeCollapse = useCallback((collapsed) => {
    setTreeCollapsed(collapsed);
  }, []);

  const getActiveNode = () => {
    const nodes = mindRef.current?.renderer?.activeNodeList || [];
    return nodes[0];
  };

  const getActiveNodes = () => {
    const nodes = mindRef.current?.renderer?.activeNodeList || [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      return nodes.filter(Boolean);
    }
    const node = getActiveNode();
    return node ? [node] : [];
  };

  const markCaseDirty = useCallback(() => {
    if (!currentCase) return;
    setCaseDirty(true);
    window.__FUNCTIONAL_CASE_UNSAVED__ = {
      dirty: true,
      path: (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase(),
    };
  }, [currentCase]);

  const execCommand = (command, ...args) => {
    if (!mindRef.current) {
      message.warning('请先选择功能用例');
      return false;
    }
    mindRef.current.execCommand(command, ...args);
    markCaseDirty();
    return true;
  };

  const execNodeCommand = (command, ...args) => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return false;
    }
    mindRef.current.execCommand(command, node, ...args);
    markCaseDirty();
    return true;
  };

  const getNodeData = (node) => {
    if (!node) return {};
    if (typeof node.getData === 'function') {
      const value = node.getData();
      if (value && typeof value === 'object') return value;
    }
    return node.nodeData?.data || {};
  };

  const getEventClientPosition = (event) => {
    const source = event?.clientX !== undefined
      ? event
      : event?.event || event?.detail?.event || event?.detail || event?.srcEvent;
    return {
      x: source?.clientX ?? source?.x ?? source?.pageX ?? 0,
      y: source?.clientY ?? source?.y ?? source?.pageY ?? 0,
    };
  };

  const renderIconPreview = (itemOrValue) => {
    const item = typeof itemOrValue === 'string' ? ICON_ITEM_MAP[itemOrValue] : itemOrValue;
    if (!item?.icon) return <span className="functional-icon-preview fallback">?</span>;
    return (
      <span
        className="functional-icon-preview svg"
        dangerouslySetInnerHTML={{ __html: item.icon }}
      />
    );
  };

  const applyNodeIcon = (value) => {
    const nodes = getActiveNodes();
    if (nodes.length === 0) {
      message.warning('请先选中脑图节点');
      return;
    }
    const type = value.split('_')[0];
    let hasOverflow = false;
    nodes.forEach((node) => {
      const currentIcons = node.getData?.('icon') || getNodeData(node).icon || [];
      const icons = Array.isArray(currentIcons) ? currentIcons : [currentIcons].filter(Boolean);
      const exists = icons.includes(value);
      const nextIconsRaw = exists
        ? icons.filter((item) => item !== value)
        : [...icons.filter((item) => !['priority', 'progress'].includes(type) || !item.startsWith(`${type}_`)), value];
      const nextIcons = normalizeNodeIcons(nextIconsRaw);
      if (nextIconsRaw.length > MAX_NODE_ICONS) {
        hasOverflow = true;
      }
      mindRef.current.execCommand('SET_NODE_ICON', node, nextIcons);
    });
    if (hasOverflow) {
      message.info(`单个节点最多展示 ${MAX_NODE_ICONS} 个图标，已自动保留前 ${MAX_NODE_ICONS} 个`);
    }
  };

  const clearNodeIcons = (node = null) => {
    const target = node || getActiveNode();
    if (!target) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_ICON', target, []);
    closeMindContextMenu();
    message.success('已移除节点图标');
  };

  const toggleNodeExpand = (expand, node = null) => {
    const target = node || getActiveNode();
    if (!target) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_EXPAND', target, expand);
    closeMindContextMenu();
  };

  const clearAllNodeIcons = () => {
    if (!mindRef.current) return;
    const root = getMindRootData(getMindData());
    const uids = [];
    const walk = (item) => {
      if (!item) return;
      if (item.data?.uid) uids.push(item.data.uid);
      (item.children || []).forEach((child) => walk(child));
    };
    walk(root);
    const finder = mindRef.current?.renderer?.findNodeByUid?.bind(mindRef.current.renderer);
    uids.forEach((uid) => {
      const node = finder ? finder(uid) : null;
      if (node) {
        mindRef.current.execCommand('SET_NODE_ICON', node, []);
      }
    });
    closeMindContextMenu();
    message.success('已移除所有节点图标');
  };

  const expandAllNodes = () => {
    execCommand('EXPAND_ALL');
    closeMindContextMenu();
  };

  const collapseAllNodes = () => {
    execCommand('UNEXPAND_ALL');
    closeMindContextMenu();
  };

  const collectNodeStyle = (node) => {
    const nodeData = getNodeData(node);
    return FORMAT_BRUSH_STYLE_KEYS.reduce((acc, key) => {
      if (nodeData[key] !== undefined && nodeData[key] !== null && nodeData[key] !== '') {
        acc[key] = nodeData[key];
      }
      return acc;
    }, {});
  };

  const stopFormatPainter = () => {
    setFormatPainterActive(false);
    setFormatPainterSourceUid(null);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: false,
      styles: null,
      sourceUid: null,
    };
  };

  const startFormatPainter = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中源节点');
      return;
    }
    const styles = collectNodeStyle(node);
    if (Object.keys(styles).length === 0) {
      message.warning('当前节点没有可复制的样式');
      return;
    }
    const sourceUid = getNodeData(node)?.uid || null;
    setFormatPainterActive(true);
    setFormatPainterSourceUid(sourceUid);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: true,
      styles,
      sourceUid,
    };
    message.info('格式刷已开启，请点击目标节点应用样式');
  };

  const bindMindEvents = useCallback(() => {
    const instance = mindRef.current;
    if (!instance || typeof instance.on !== 'function' || instance.__formatPainterBound) {
      return;
    }
    const handleNodeActive = (node) => {
      const painter = formatPainterRef.current;
      if (!painter.active || !painter.styles) return;
      const activeNode = node || getActiveNode();
      if (!activeNode) return;
      const activeUid = getNodeData(activeNode)?.uid || null;
      if (painter.sourceUid && activeUid && painter.sourceUid === activeUid) return;
      instance.execCommand('SET_NODE_STYLES', activeNode, painter.styles);
      message.success('已应用格式');
      stopFormatPainter();
    };
    const handleNodeContextMenu = (event, node) => {
      event?.preventDefault?.();
      nodeContextMenuRef.current = true;
      const pos = getEventClientPosition(event);
      setMindContextMenu({
        open: true,
        x: pos.x,
        y: pos.y,
        type: 'node',
        node,
      });
    };
    const handleCanvasContextMenu = (event) => {
      event?.preventDefault?.();
      if (nodeContextMenuRef.current) {
        nodeContextMenuRef.current = false;
        return;
      }
      const pos = getEventClientPosition(event);
      setMindContextMenu({
        open: true,
        x: pos.x,
        y: pos.y,
        type: 'canvas',
        node: null,
      });
    };
    const handleScaleSync = () => {
      requestAnimationFrame(syncScaleFromMind);
    };
    const handleDirtyChange = () => {
      if (suppressDirtyCheckRef.current) return;
      setCaseDirty(true);
      if (dirtyCheckTimerRef.current) {
        window.clearTimeout(dirtyCheckTimerRef.current);
      }
      dirtyCheckTimerRef.current = window.setTimeout(() => {
        dirtyCheckTimerRef.current = null;
        runDirtyCheck();
      }, 180);
    };
    instance.on('node_active', handleNodeActive);
    instance.on('node_contextmenu', handleNodeContextMenu);
    instance.on('contextmenu', handleCanvasContextMenu);
    ['view_data_change', 'view_change', 'scale', 'translate', 'data_change'].forEach((eventName) => {
      instance.on(eventName, handleScaleSync);
    });
    instance.on('data_change', handleDirtyChange);
    instance.__formatPainterBound = true;
    instance.__formatPainterHandler = handleNodeActive;
    instance.__nodeContextMenuHandler = handleNodeContextMenu;
    instance.__canvasContextMenuHandler = handleCanvasContextMenu;
    instance.__scaleSyncHandler = handleScaleSync;
    instance.__dirtyChangeHandler = handleDirtyChange;
  }, [runDirtyCheck, syncScaleFromMind]);

  const renderMindMap = useCallback((data, options = {}) => {
    if (!data) return;
    const { fitOnRender = false, fallbackTitle = '' } = options;
    const safeData = sanitizeMindData(data, fallbackTitle);
    const rootData = getMindRootData(safeData);
    const fullData = isFullMindData(safeData) ? safeData : null;
    clearRenderFrame();
    renderRetryRef.current = 0;

    const run = () => {
      const el = mindContainerRef.current;
      if (!el) return;

      const { width, height } = el.getBoundingClientRect();
      if ((width <= 0 || height <= 0) && renderRetryRef.current < 20) {
        renderRetryRef.current += 1;
        renderFrameRef.current = requestAnimationFrame(run);
        return;
      }

      if (width <= 0 || height <= 0) {
        message.error('脑图容器还未完成布局，请稍后重试');
        return;
      }

      renderRetryRef.current = 0;
      if (!mindRef.current) {
        mindRef.current = new MindMap({
          el,
          data: rootData,
          layout: fullData?.layout || 'logicalStructure',
          theme: fullData?.theme?.template || 'default',
          themeConfig: fullData?.theme?.config || {},
          fit: true,
          readonly: false,
          enableCtrlKeyNodeSelection: true,
          useLeftKeySelectionRightKeyDrag: ctrlSelectModeRef.current,
          iconList: MIND_ICON_LIST,
        });
        bindMindEvents();
        if (fullData) {
          mindRef.current.setFullData(fullData);
        }
        requestAnimationFrame(() => {
          if (fitOnRender) {
            mindRef.current?.view?.fit?.();
          }
          syncScaleFromMind();
        });
        return;
      }
      if (fullData) {
        mindRef.current.setFullData(fullData);
      } else {
        mindRef.current.setData(rootData);
      }
      requestAnimationFrame(() => {
        if (fitOnRender) {
          mindRef.current?.view?.fit?.();
        }
        syncScaleFromMind();
      });
    };

    renderFrameRef.current = requestAnimationFrame(run);
  }, [clearRenderFrame, syncScaleFromMind]);

  const loadCase = async (record, options = {}) => {
    const { force = false } = options;
    if (!projectId) return;
    if (!force && caseDirty && currentCase?.id && record?.id && currentCase.id !== record.id) {
      openUnsavedConfirm(() => loadCase(record, { force: true }));
      return;
    }
    setLoadingCase(true);
    try {
      const res = await queryFunctionalCaseFile({ id: record.id, project_id: projectId });
      if (res?.code === 0) {
        suppressDirtyCheckRef.current = true;
        savedCaseSnapshotRef.current = buildCaseSnapshot(res?.data?.data, res?.data?.title || record?.title || '功能用例');
        setCaseDirty(false);
        setCurrentCase({
          ...res.data,
          case_count: Number(res?.data?.case_count ?? res?.data?.case_num ?? 0),
          create_user_name: res?.data?.create_user_name || res?.data?.creator_name || record?.create_user_name || '',
        });
      } else {
        message.error(res?.msg || '获取功能用例详情失败');
        setLoadingCase(false);
      }
    } catch (error) {
      message.error(error?.message || '获取功能用例详情失败');
      setLoadingCase(false);
    }
  };

  useEffect(() => {
    if (!dispatch) return;
    dispatch({ type: 'project/listProject' });
  }, [dispatch]);

  useEffect(() => {
    if (!dispatch || projects.length === 0) return;
    const exists = projects.some((item) => item.id === projectId);
    if (exists) return;
    const firstProjectId = projects[0]?.id;
    if (!firstProjectId) return;
    saveProject(firstProjectId);
  }, [dispatch, projects, projectId, saveProject]);

  useEffect(() => {
    if (!projectId) {
      setDirectoryTree([]);
      setCaseFiles([]);
      setCurrentDirectory(null);
      setCurrentCase(null);
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      suppressDirtyCheckRef.current = false;
      destroyMindMap();
      return;
    }
    fetchTree('', projectId);
  }, [projectId, fetchTree, destroyMindMap]);

  useEffect(() => () => {
    destroyMindMap();
  }, [destroyMindMap]);

  useEffect(() => {
    currentDirectoryRef.current = currentDirectory;
  }, [currentDirectory]);

  useEffect(() => {
    if (!caseDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = UNSAVED_CASE_CLOSE_TEXT;
      return UNSAVED_CASE_CLOSE_TEXT;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [caseDirty]);

  useEffect(() => {
    window.__FUNCTIONAL_CASE_UNSAVED__ = {
      dirty: caseDirty,
      path: (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase(),
    };
    return () => {
      if (window.__FUNCTIONAL_CASE_UNSAVED__) {
        window.__FUNCTIONAL_CASE_UNSAVED__ = { dirty: false, path: '' };
      }
    };
  }, [caseDirty]);

  useEffect(() => {
    if (typeof history?.block !== 'function') return undefined;
    const unblock = history.block((tx) => {
      if (!caseDirty) {
        unblock();
        tx.retry?.();
        return;
      }
      if (routeConfirmingRef.current) return;
      routeConfirmingRef.current = true;
      openUnsavedConfirm(
        () => {
          routeConfirmingRef.current = false;
          unblock();
          tx.retry?.();
        },
        () => {
          routeConfirmingRef.current = false;
        },
      );
    });
    return () => unblock?.();
  }, [caseDirty, openUnsavedConfirm]);

  useEffect(() => {
    const currentPath = (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase();
    const getTopTabCloseButton = (target) => {
      if (!(target instanceof HTMLElement)) return null;
      const button = target.closest('.ant-tabs-tab-remove');
      if (!(button instanceof HTMLButtonElement)) return null;
      const tabItem = button.closest('[data-node-key]');
      const nodeKey = String(tabItem?.getAttribute?.('data-node-key') || '').toLowerCase();
      if (!nodeKey) return null;
      if (!nodeKey.startsWith(currentPath)) return null;
      return button;
    };

    const handleTopTabClose = (event) => {
      if (!caseDirty || tabActionBypassRef.current) return;
      const closeButton = getTopTabCloseButton(event.target);
      if (!closeButton) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openUnsavedConfirm(
        () => {
          tabActionBypassRef.current = true;
          window.setTimeout(() => {
            closeButton.click();
            window.setTimeout(() => {
              tabActionBypassRef.current = false;
            }, 0);
          }, 0);
        },
        () => {
          tabActionBypassRef.current = false;
        },
      );
    };

    document.addEventListener('click', handleTopTabClose, true);
    return () => document.removeEventListener('click', handleTopTabClose, true);
  }, [caseDirty, openUnsavedConfirm]);

  useEffect(() => {
    if (currentCase) {
      setScale(100);
      suppressDirtyCheckRef.current = true;
      renderMindMap(currentCase.data || defaultCaseData(currentCase.title), {
        fitOnRender: !mindRef.current,
        fallbackTitle: currentCase.title,
      });
      caseRenderTimerRef.current = window.setTimeout(() => {
        suppressDirtyCheckRef.current = false;
        setLoadingCase(false);
        caseRenderTimerRef.current = null;
      }, 180);
    } else {
      suppressDirtyCheckRef.current = false;
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      destroyMindMap();
      setLoadingCase(false);
    }
  }, [currentCase?.id, destroyMindMap, renderMindMap]);

  useEffect(() => {
    if (!currentCase || !mindRef.current) return undefined;
    let firstFrame = null;
    let secondFrame = null;
    const timer = window.setTimeout(() => refreshMindGeometry(true), 260);
    firstFrame = requestAnimationFrame(() => {
      refreshMindGeometry(true);
      secondFrame = requestAnimationFrame(() => refreshMindGeometry(true));
    });
    return () => {
      if (firstFrame) cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
    };
  }, [treeCollapsed, currentCase?.id, refreshMindGeometry]);

  useEffect(() => {
    const el = mindContainerRef.current;
    if (!el || !currentCase || typeof ResizeObserver === 'undefined') return undefined;
    let frame = null;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refreshMindGeometry(true));
    });
    observer.observe(el);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentCase?.id, refreshMindGeometry]);

  useEffect(() => {
    const el = mindContainerRef.current;
    if (!el || !currentCase) return undefined;
    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(syncScaleFromMind);
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentCase?.id, syncScaleFromMind]);

  useEffect(() => {
    const enableCtrlSelect = () => {
      if (!mindRef.current || ctrlSelectModeRef.current) return;
      ctrlSelectModeRef.current = true;
      mindRef.current.updateConfig?.({
        enableCtrlKeyNodeSelection: true,
        useLeftKeySelectionRightKeyDrag: true,
      });
    };
    const disableCtrlSelect = () => {
      if (!mindRef.current || !ctrlSelectModeRef.current) return;
      ctrlSelectModeRef.current = false;
      mindRef.current.updateConfig?.({
        enableCtrlKeyNodeSelection: true,
        useLeftKeySelectionRightKeyDrag: false,
      });
    };

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        enableCtrlSelect();
      }
    };
    const handleKeyUp = (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        disableCtrlSelect();
      }
    };
    const handleBlur = () => disableCtrlSelect();
    const handleMouseDown = (event) => {
      if (!mindContainerRef.current || !mindRef.current) return;
      if ((event.ctrlKey || event.metaKey) && mindContainerRef.current.contains(event.target)) {
        enableCtrlSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('blur', handleBlur);
      disableCtrlSelect();
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setCanvasFullscreen(document.fullscreenElement === editorPanelRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const refreshTree = async () => {
    if (!projectId) return;
    await fetchTree(appliedKeyword, projectId);
  };

  const openDirectoryModal = (record = null, parent = null) => {
    setDirectoryName(record?.title || record?.name || '');
    setDirectoryModal({ open: true, record, parent });
  };

  const submitDirectory = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    const name = directoryName.trim();
    if (!name) {
      message.warning('请输入目录名称');
      return;
    }
    const payload = {
      project_id: projectId,
      name,
      parent: directoryModal.record ? directoryModal.record.parent : directoryModal.parent,
      sort_index: directoryModal.record?.sort_index || 0,
    };
    const res = directoryModal.record
      ? await updateFunctionalCaseDirectory({ ...payload, id: directoryModal.record.id })
      : await insertFunctionalCaseDirectory(payload);
    if (res?.code === 0) {
      message.success('保存成功');
      setDirectoryModal({ open: false, record: null, parent: null });
      await refreshTree();
    } else {
      message.error(res?.msg || '保存目录失败');
    }
  };

  const handleDeleteDirectory = async (id) => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseDirectory({ id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      if (currentDirectory === id) {
        setCurrentDirectory(null);
        setCurrentCase(null);
        destroyMindMap();
      }
      await refreshTree();
    } else {
      message.error(res?.msg || '删除目录失败');
    }
  };

  const openCaseModal = (record = null, directoryId = currentDirectory) => {
    setCaseTitle(record?.title || '');
    setCaseModal({ open: true, record, directoryId });
  };

  const submitCase = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    const title = caseTitle.trim();
    if (!title) {
      message.warning('请输入用例名称');
      return;
    }
    const directoryId = caseModal.directoryId || currentDirectory;
    if (!directoryId) {
      message.warning('请先选择目录');
      return;
    }
    let data = caseModal.record?.data;
    if (caseModal.record?.id === currentCase?.id) {
      data = getMindData();
    } else if (caseModal.record?.id && !data) {
      const detailRes = await queryFunctionalCaseFile({ id: caseModal.record.id, project_id: projectId });
      if (detailRes?.code !== 0) {
        message.error(detailRes?.msg || '获取功能用例详情失败');
        return;
      }
      data = detailRes.data?.data;
    }
    data = sanitizeMindData(data || defaultCaseData(title), title);
    const res = caseModal.record
      ? await updateFunctionalCaseFile({
        ...caseModal.record,
        project_id: projectId,
        title,
        directory_id: directoryId,
        data,
        sort_index: caseModal.record.sort_index || 0,
      })
      : await insertFunctionalCaseFile({ project_id: projectId, title, directory_id: directoryId, data, sort_index: 0 });
    if (res?.code === 0) {
      message.success('保存成功');
      setCaseModal({ open: false, record: null, directoryId: null });
      setCurrentDirectory(directoryId);
      await refreshTree();
      await loadCase(res.data);
    } else {
      message.error(res?.msg || '保存用例失败');
    }
  };

  const saveMind = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    if (!currentCase) {
      message.warning('请先选择功能用例');
      return;
    }
    setSaving(true);
    try {
      const latestData = sanitizeMindData(getMindData());
      const res = await updateFunctionalCaseFile({
        id: currentCase.id,
        project_id: projectId,
        title: currentCase.title,
        directory_id: currentCase.directory_id,
        data: latestData,
        sort_index: currentCase.sort_index || 0,
      });
      if (res?.code === 0) {
        message.success('保存成功');
        const detailRes = await queryFunctionalCaseFile({ id: res?.data?.id || currentCase.id, project_id: projectId });
        if (detailRes?.code === 0) {
          savedCaseSnapshotRef.current = buildCaseSnapshot(detailRes?.data?.data, detailRes?.data?.title || currentCase.title);
          setCaseDirty(false);
          setCurrentCase(detailRes.data);
        } else {
          savedCaseSnapshotRef.current = buildCaseSnapshot(latestData, currentCase.title);
          setCaseDirty(false);
          setCurrentCase((prev) => ({ ...prev, data: latestData }));
        }
        await refreshTree();
      } else {
        message.error(res?.msg || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCase = async () => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseFile({ id: currentCase.id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      setCurrentCase(null);
      destroyMindMap();
      await refreshTree();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const deleteCaseById = async (id) => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseFile({ id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      if (currentCase?.id === id) {
        setCurrentCase(null);
        destroyMindMap();
      }
      await refreshTree();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const openMoveModal = (type, record) => {
    setMoveModal({ open: true, type, record });
    if (type === 'directory') {
      setMoveParent(record.parent ?? null);
      setMoveDirectoryId(null);
      setMoveSortIndex(record.sort_index || 0);
      return;
    }
    setMoveDirectoryId(record.directory_id || currentDirectory);
    setMoveParent(null);
    setMoveSortIndex(record.sort_index || 0);
  };

  const submitMove = async () => {
    if (!projectId) return;
    if (!moveModal.record) return;
    if (moveModal.type === 'directory') {
      const res = await moveFunctionalCaseDirectory({
        id: moveModal.record.id,
        project_id: projectId,
        parent: moveParent ?? null,
        sort_index: moveSortIndex || 0,
      });
      if (res?.code === 0) {
        message.success('移动成功');
        setMoveModal({ open: false, type: '', record: null });
        await refreshTree();
      } else {
        message.error(res?.msg || '移动目录失败');
      }
      return;
    }

    if (!moveDirectoryId) {
      message.warning('请选择目标目录');
      return;
    }
    const res = await moveFunctionalCaseFile({
      id: moveModal.record.id,
      project_id: projectId,
      directory_id: moveDirectoryId,
      sort_index: moveSortIndex || 0,
    });
    if (res?.code === 0) {
      message.success('移动成功');
      if (currentCase?.id === moveModal.record.id) {
        setCurrentCase({ ...currentCase, directory_id: moveDirectoryId, sort_index: moveSortIndex || 0 });
        setCurrentDirectory(moveDirectoryId);
      }
      setMoveModal({ open: false, type: '', record: null });
      await refreshTree();
    } else {
      message.error(res?.msg || '移动用例失败');
    }
  };

  const handleDrop = async ({ dragNode, node }) => {
    if (!projectId) return;
    const targetDirectoryId = node.nodeType === 'case' ? node.directory_id : node.id;
    if (!targetDirectoryId) return;
    if (dragNode.nodeType === 'directory') {
      if (dragNode.id === targetDirectoryId) return;
      const res = await moveFunctionalCaseDirectory({
        id: dragNode.id,
        project_id: projectId,
        parent: targetDirectoryId,
        sort_index: dragNode.sort_index || 0,
      });
      if (res?.code === 0) {
        message.success('目录已移动');
        await refreshTree();
      } else {
        message.error(res?.msg || '移动目录失败');
      }
      return;
    }
    const res = await moveFunctionalCaseFile({
      id: dragNode.id,
      project_id: projectId,
      directory_id: targetDirectoryId,
      sort_index: dragNode.sort_index || 0,
    });
    if (res?.code === 0) {
      message.success('用例已移动');
      await refreshTree();
    } else {
      message.error(res?.msg || '移动用例失败');
    }
  };

  const applyTheme = (value) => {
    const preset = THEME_PRESETS.find((item) => item.value === value);
    if (!preset || !mindRef.current) return;
    setActiveThemeValue(value);
    mindRef.current.setThemeConfig(preset.config);
  };

  const applyLayout = (value) => {
    if (!mindRef.current) return;
    try {
      mindRef.current.setLayout(value);
      setActiveLayoutValue(value);
    } catch {
      message.warning('当前结构暂不可用，已保持原结构');
    }
  };

  const setNodeStyle = (prop, value) => {
    execNodeCommand('SET_NODE_STYLE', prop, value);
  };

  const getActiveNodeStyleValue = (prop) => {
    const node = getActiveNode();
    if (!node) return undefined;
    if (typeof node.getData === 'function') {
      const dataValue = node.getData(prop);
      if (typeof dataValue !== 'undefined') return dataValue;
    }
    if (typeof node.getStyle === 'function') {
      return node.getStyle(prop);
    }
    return undefined;
  };

  const toggleNodeStyle = (prop, activeValue, inactiveValue) => {
    const currentValue = getActiveNodeStyleValue(prop);
    const nextValue = currentValue === activeValue ? inactiveValue : activeValue;
    setNodeStyle(prop, nextValue);
  };

  const setNodeStyles = (styles) => {
    execNodeCommand('SET_NODE_STYLES', styles);
  };

  const setThemeValue = (prop, value) => {
    if (!mindRef.current) {
      message.warning('请先选择功能用例');
      return;
    }
    const viewData = mindRef.current.view?.getTransformData?.();
    const drawTransform = mindRef.current.draw?.transform?.();
    const fullData = mindRef.current.getData?.(true) || {};
    const currentConfig = fullData.theme?.config || mindRef.current.opt?.themeConfig || {};
    mindRef.current.setThemeConfig({ ...currentConfig, [prop]: value });
    mindRef.current.associativeLine?.renderAllLines?.();
    mindRef.current.render?.();
    requestAnimationFrame(() => {
      if (viewData && mindRef.current?.view?.setTransformData) {
        mindRef.current.view.setTransformData(viewData);
      } else if (drawTransform) {
        mindRef.current?.draw?.transform?.(drawTransform);
      }
      syncScaleFromMind();
    });
  };

  const updateMindConfig = (config) => {
    if (!mindRef.current) {
      message.warning('请先选择功能用例');
      return;
    }
    mindRef.current.updateConfig(config);
  };

  const fitView = () => {
    if (!mindRef.current) {
      message.warning('请先选择功能用例');
      return;
    }
    mindRef.current.view?.fit?.();
    requestAnimationFrame(syncScaleFromMind);
  };

  const resetView = () => {
    if (!mindRef.current) {
      message.warning('请先选择功能用例');
      return;
    }
    mindRef.current.view?.reset?.();
    requestAnimationFrame(syncScaleFromMind);
  };

  const centerActiveNode = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current?.renderer?.moveNodeToCenter?.(node);
  };

  const toggleActiveNodeExpand = (expand) => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_EXPAND', node, expand);
  };

  const clearNodeExtra = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_ICON', node, []);
    mindRef.current.execCommand('SET_NODE_TAG', node, []);
    mindRef.current.execCommand('SET_NODE_HYPERLINK', node, '', '');
    mindRef.current.execCommand('SET_NODE_NOTE', node, '');
    mindRef.current.execCommand('SET_NODE_ATTACHMENT', node, '', '');
    mindRef.current.execCommand('SET_NODE_IMAGE', node, { url: null });
  };

  const renderColorSwatches = (onPick) => (
    <div className="functional-color-grid">
      {COLOR_SWATCHES.map((color) => (
        <button
          type="button"
          key={color}
          title={color}
          style={{ background: color }}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  );

  const renderColorField = (label, onPick) => (
    <div className="functional-color-field">
      <span>{label}</span>
      {renderColorSwatches(onPick)}
    </div>
  );

  const renderSliderField = (label, field, onChange, min = 0, max = 40) => (
    <div className="functional-slider-field">
      <div className="functional-slider-label">
        <span>{label}</span>
        <strong>{styleDraft[field]}</strong>
      </div>
      <Slider
        min={min}
        max={max}
        value={styleDraft[field]}
        onChange={(value) => {
          setStyleDraft((prev) => ({ ...prev, [field]: value }));
          onChange(value);
        }}
      />
    </div>
  );

  const openLink = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setLinkUrl(node.getData?.('hyperlink') || '');
    setLinkTitle(node.getData?.('hyperlinkTitle') || '');
    setLinkModal({ open: true });
  };

  const submitLink = () => {
    execNodeCommand('SET_NODE_HYPERLINK', linkUrl.trim(), linkTitle.trim());
    setLinkModal({ open: false });
  };

  const openNote = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setNoteText(node.getData?.('note') || '');
    setNoteModal({ open: true });
  };

  const submitNote = () => {
    execNodeCommand('SET_NODE_NOTE', noteText);
    setNoteModal({ open: false });
  };

  const openImage = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setImageUrl(node.getData?.('image') || '');
    setImageModal({ open: true });
  };

  const submitImage = () => {
    const url = imageUrl.trim();
    execNodeCommand('SET_NODE_IMAGE', url ? { url } : { url: null });
    setImageModal({ open: false });
  };

  const openAttachment = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setAttachmentUrl(node.getData?.('attachmentUrl') || '');
    setAttachmentName(node.getData?.('attachmentName') || '');
    setAttachmentModal({ open: true });
  };

  const submitAttachment = () => {
    execNodeCommand('SET_NODE_ATTACHMENT', attachmentUrl.trim(), attachmentName.trim());
    setAttachmentModal({ open: false });
  };

  const submitFormula = () => {
    if (!formulaText.trim()) {
      message.warning('请输入公式');
      return;
    }
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    const formula = formulaText.trim();
    if (mindRef.current.formula?.insertFormulaToNode && mindRef.current.richText?.showEditText) {
      mindRef.current.formula.insertFormulaToNode(node, formula);
    } else {
      const currentText = getNodeData(node).text || '';
      const nextText = currentText ? `${currentText}\n$${formula}$` : `$${formula}$`;
      mindRef.current.execCommand('SET_NODE_DATA', node, {
        text: nextText,
        formula,
      });
      mindRef.current.render?.();
    }
    setFormulaModal({ open: false });
    setFormulaText('');
  };

  const openFormulaModal = () => {
    if (!getActiveNode()) {
      message.warning('请先选中脑图节点');
      return;
    }
    setFormulaText('');
    setFormulaModal({ open: true });
  };

  const openExportModal = () => {
    if (!currentCase) return;
    setExportModal({
      open: true,
      type: 'png',
      name: currentCase.title || '功能用例',
    });
  };

  const submitExport = async () => {
    if (!mindRef.current || !currentCase) {
      message.warning('请先选择功能用例');
      return;
    }
    const fileName = (exportModal.name || currentCase.title || '功能用例').trim();
    const typeMap = {
      png: 'png',
      xmind: 'xmind',
      markdown: 'md',
    };
    const exportType = typeMap[exportModal.type] || exportModal.type;
    try {
      if (exportModal.type === 'xmind') {
        const originalData = mindRef.current.getData(true);
        await exportXMindFile(normalizeXMindExportData(originalData), fileName);
        setExportModal((prev) => ({ ...prev, open: false }));
        message.warning('XMind 客户端对网页自定义样式支持有限，已导出优先级/进度标记和标签；完整视觉请导出 PNG。');
        return;
      }
      await mindRef.current.export(exportType, true, fileName);
      setExportModal((prev) => ({ ...prev, open: false }));
      message.success('导出成功');
    } catch (error) {
      if (exportModal.type === 'markdown') {
        try {
          await mindRef.current.export('markdown', true, fileName);
          setExportModal((prev) => ({ ...prev, open: false }));
          message.success('导出成功');
          return;
        } catch (innerError) {
          message.error('导出失败');
          return;
        }
      }
      message.error('导出失败');
    }
  };

  const confirmDeleteCurrentCase = () => {
    if (!currentCase) return;
    Modal.confirm({
      title: '确认删除该功能用例吗？',
      centered: true,
      content: `将删除「${currentCase.title || '未命名用例'}」，删除后不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteCase(),
    });
  };

  const toggleCanvasFullscreen = async () => {
    const target = editorPanelRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen?.();
      } else if (!document.fullscreenElement) {
        await target.requestFullscreen?.();
      }
    } catch (error) {
      message.warning('当前浏览器不支持全屏切换');
    }
  };

  const triggerImport = () => {
    importFileRef.current?.click?.();
  };

  const parseImportFile = (file) => {
    const lowerName = (file?.name || '').toLowerCase();
    const isXmind = lowerName.endsWith('.xmind');
    if (isXmind) {
      const parser = mindRef.current?.doExportXMind?.getXmind?.();
      if (!parser?.parseXmindFile) {
        return Promise.reject(new Error('当前环境未启用 XMind 解析能力'));
      }
      return parser.parseXmindFile(file, false).then((data) => sanitizeMindData(data));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = sanitizeMindData(JSON.parse(reader.result));
          resolve(data);
        } catch (error) {
          reject(new Error('导入文件不是有效的 JSON'));
        }
      };
      reader.onerror = () => reject(new Error('读取导入文件失败'));
      reader.readAsText(file, 'utf-8');
    });
  };

  const applyImportedData = (data, titleOverride = null) => {
    setCaseDirty(true);
    setCurrentCase((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        title: titleOverride || prev.title,
        data,
      };
    });
    if (!mindRef.current) {
      return;
    }
    if (isFullMindData(data) || data.layout || data.theme) {
      mindRef.current.setFullData(data);
    } else {
      mindRef.current.setData(data);
    }
  };

  const importJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    const lowerName = (file.name || '').toLowerCase();
    const isAllowed = lowerName.endsWith('.json') || lowerName.endsWith('.xmind');
    if (!isAllowed) {
      message.warning('仅支持导入 .json 或 .xmind 文件');
      return;
    }
    Modal.confirm({
      title: '确认覆盖当前用例数据？',
      centered: true,
      content: '导入后将会覆盖当前在线编辑内容，且不可撤销。',
      okText: '是，覆盖导入',
      cancelText: '否，取消导入',
      onOk: async () => {
        try {
          const data = await parseImportFile(file);
          applyImportedData(data);
          message.success('导入成功，已覆盖当前用例数据');
        } catch (error) {
          message.error(error?.message || '导入失败，请检查文件格式');
        }
      },
      onCancel: () => {
        message.info('已取消导入');
      },
    });
  };

  const openAIModal = () => {
    if (!currentCase) return;
    setAiModal((prev) => ({ ...prev, open: true }));
  };

  const openSkillAIModal = () => {
    if (!currentCase) return;
    setSkillAiStep(0);
    setSkillAiModal((prev) => ({
      ...prev,
      open: true,
      stage: 'idle',
      stageText: '',
      errorMessage: '',
      reviewProvider: '',
      reviewRounds: 0,
      progress: 0,
      taskId: null,
      polling: false,
      taskLogs: [],
      resultMdUrl: '',
      resultCaseCount: 0,
    }));
  };

  const closeAIModal = () => {
    if (aiModal.loading) return;
    setAiModal((prev) => ({ ...prev, open: false }));
  };

  const resetSkillAIModal = useCallback(() => {
    setSkillAiStep(0);
    setSkillAiModal((prev) => ({
      ...prev,
      open: false,
      polling: false,
      taskId: null,
      progress: 0,
      stage: 'idle',
      stageText: '',
      errorMessage: '',
      reviewProvider: '',
      reviewRounds: 0,
      taskLogs: [],
      resultMdUrl: '',
      resultCaseCount: 0,
    }));
  }, []);

  const closeSkillAIModal = () => {
    if (skillAiModal.loading) return;
    Modal.confirm({
      title: skillAiModal.polling ? '确认关闭生成弹窗？' : '确认取消当前操作？',
      content: skillAiModal.polling
        ? '关闭弹窗不会取消后台生成任务，后台仍会继续生成测试用例。确认关闭吗？'
        : '关闭后当前填写的需求、提示词和已选文档将被清空。确认继续吗？',
      okText: '确认',
      cancelText: '继续编辑',
      onOk: resetSkillAIModal,
    });
  };

  const skillStepItems = [
    { title: '明确需求' },
    { title: '技能/提示' },
    { title: '完成' },
  ];

  const skillTaskProgressItems = [
    { title: '任务创建' },
    { title: '组装需求和技能材料' },
    { title: '调用模型生成测试用例' },
    { title: '审查测试用例' },
    { title: '完成' },
  ];

  const resolveSkillTaskProgressIndex = () => {
    const stage = String(skillAiModal.stage || '').toLowerCase();
    const stageText = String(skillAiModal.stageText || '').toLowerCase();
    if (skillAiModal.errorMessage) {
      return 3;
    }
    if (stage === 'success' || stage === 'done' || stage.includes('done') || stageText.includes('完成') || stageText.includes('已生成')) {
      return 4;
    }
    if (stage.includes('review') || stageText.includes('审查')) {
      return 3;
    }
    if (stage.includes('generate') || stage.includes('model') || stage.includes('convert') || stage.includes('parse') || stageText.includes('调用') || stageText.includes('模型') || stageText.includes('生成测试用例')) {
      return 2;
    }
    if (stage.includes('prepare') || stageText.includes('组装') || stageText.includes('材料')) {
      return 1;
    }
    return 0;
  };

  const handleSkillStepNext = () => {
    if (skillAiStep >= 2) return;
    setSkillAiStep((prev) => Math.min(prev + 1, 2));
  };

  const handleSkillStepPrev = () => {
    if (skillAiStep <= 0) return;
    setSkillAiStep((prev) => Math.max(prev - 1, 0));
  };


  const handleAIUpload = (file) => {
    if (!file?.type?.startsWith?.('image/')) {
      message.warning('仅支持上传图片格式的需求截图');
      return Upload.LIST_IGNORE;
    }
    setAiModal((prev) => ({
      ...prev,
      fileList: [...prev.fileList, file].slice(-6),
    }));
    return false;
  };

  const removeAIUpload = (target) => {
    setAiModal((prev) => ({
      ...prev,
      fileList: prev.fileList.filter((item) => item.uid !== target.uid),
    }));
  };

  const handleSkillAIUpload = (file) => {
    if (!file?.type?.startsWith?.('image/')) {
      message.warning('仅支持上传图片格式的需求截图');
      return Upload.LIST_IGNORE;
    }
    setSkillAiModal((prev) => ({
      ...prev,
      fileList: [...prev.fileList, file].slice(-6),
    }));
    return false;
  };

  const removeSkillAIUpload = (target) => {
    setSkillAiModal((prev) => ({
      ...prev,
      fileList: prev.fileList.filter((item) => item.uid !== target.uid),
    }));
  };

  const submitAIGenerate = async () => {
    if (!currentCase || !projectId) {
      message.warning('请先选择项目和功能用例');
      return;
    }
    const requirementText = aiModal.requirementText.trim();
    const instructionText = aiModal.instructionText.trim();
    if (!requirementText && !instructionText && aiModal.fileList.length === 0) {
      message.warning('请至少输入需求描述、生成要求或上传一张需求截图');
      return;
    }
    setAiModal((prev) => ({ ...prev, loading: true }));
    try {
      const images = await Promise.all(
        aiModal.fileList.map((file) => readFileAsDataUrl(file.originFileObj || file)),
      );
      const res = await aiGenerateFunctionalCase({
        project_id: projectId,
        title: currentCase.title || '功能用例',
        requirement_text: requirementText,
        instruction_text: instructionText,
        images,
      });
      if (res?.code !== 0) {
        throw new Error(res?.msg || 'AI 生成失败');
      }
      const generatedTitle = res?.data?.title || currentCase.title || '功能用例';
      const generatedData = sanitizeMindData(res?.data?.data || defaultCaseData(generatedTitle));
      applyImportedData(generatedData, generatedTitle);
      setAiModal((prev) => ({
        ...prev,
        open: false,
        loading: false,
        requirementText: '',
        instructionText: '',
        fileList: [],
      }));
      message.success(`AI 已生成用例，识别到 ${res?.data?.case_count || res?.data?.case_num || 0} 条候选用例，请检查后保存`);
    } catch (error) {
      setAiModal((prev) => ({ ...prev, loading: false }));
      message.error(error?.message || 'AI 生成失败');
    }
  };

  const submitSkillAIGenerate = async () => {
    if (!currentCase || !projectId) {
      message.warning('请先选择项目和功能用例');
      return;
    }
    const requirementText = skillAiModal.requirementText.trim();
    const instructionText = skillAiModal.instructionText.trim();
    if (!requirementText && !instructionText && skillAiModal.fileList.length === 0) {
      message.warning('请至少输入需求描述、生成要求或上传一张需求截图');
      return;
    }
    setSkillAiModal((prev) => ({ ...prev, loading: true }));
    try {
      const images = await Promise.all(
        skillAiModal.fileList.map((file) => readFileAsDataUrl(file.originFileObj || file)),
      );
      const createRes = await createFunctionalCaseSkillTask({
        project_id: projectId,
        title: currentCase.title || '功能用例',
        requirement_text: requirementText,
        instruction_text: instructionText,
        images,
        doc_ids: skillAiModal.selectedDocIds,
      });
      if (createRes?.code !== 0) {
        throw new Error(createRes?.msg || '技能生成任务创建失败');
      }
      const taskId = createRes?.data?.task_id;
      if (!taskId) {
        throw new Error('未获取到任务编号');
      }
      setSkillAiModal((prev) => ({
        ...prev,
        loading: false,
        polling: true,
        taskId,
        progress: Number(createRes?.data?.progress || 0),
        stage: createRes?.data?.stage || 'queued',
        stageText: '任务已创建，正在等待后台执行',
        errorMessage: '',
        reviewProvider: '',
        reviewRounds: 0,
        taskLogs: [],
        resultMdUrl: '',
        resultCaseCount: 0,
      }));
      setSkillAiStep(2);
      message.success('技能生成任务已创建，正在后台执行');
    } catch (error) {
      setSkillAiModal((prev) => ({ ...prev, loading: false }));
      message.error(error?.message || '技能生成失败');
    }
  };

  const updateScale = (nextScale) => {
    const safeScale = Math.min(200, Math.max(20, nextScale));
    setScale(safeScale);
    if (mindRef.current?.view?.setScale) {
      mindRef.current.view.setScale(safeScale / 100);
      requestAnimationFrame(syncScaleFromMind);
    }
  };

  const treeMenu = (node) => {
    if (node.nodeType === 'case') {
      return (
        <Menu>
          <Menu.Item key="open" icon={<FileTextOutlined />} onClick={() => loadCase(node.raw)}>
            打开用例
          </Menu.Item>
          <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => openCaseModal(node.raw, node.directory_id)}>
            编辑名称
          </Menu.Item>
          <Menu.Item key="move" icon={<ExportOutlined />} onClick={() => openMoveModal('case', node.raw)}>
            移动/排序
          </Menu.Item>
        </Menu>
      );
    }
    return (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => openDirectoryModal(node)}>
          编辑目录
        </Menu.Item>
        <Menu.Item key="move" icon={<ExportOutlined />} onClick={() => openMoveModal('directory', node)}>
          移动/排序
        </Menu.Item>
      </Menu>
    );
  };

  const titleRender = (node) => (
    <div
      className={`functional-tree-title ${node.nodeType === 'case' ? 'functional-tree-case' : ''}`}
      onMouseEnter={() => setNodeKey(node.key)}
      onMouseLeave={() => setNodeKey(null)}
    >
      {node.nodeType === 'case' ? (
        <FileTextOutlined className="folder functional-case-folder" />
      ) : (
        <FolderCode theme="outline" size="15" className="folder" />
      )}
      <span className="functional-tree-content">
        <span className="functional-tree-name-line">
          <span className="functional-tree-text">{getNodeText(node.title)}</span>
          <span className="functional-tree-count">({Number(node.case_count || 0)})</span>
        </span>
      </span>
      <span className={`suffixButton ${node.nodeType === 'directory' ? 'directory-actions' : 'case-actions'} ${nodeKey === node.key ? 'visible' : ''}`}>
        {node.nodeType === 'directory' ? (
          <FolderAddOutlined
            className="icon-left"
            onClick={(event) => {
              event.stopPropagation();
              openDirectoryModal(null, node.id);
            }}
          />
        ) : null}
        {node.nodeType === 'directory' ? (
          <FileAddOutlined
            className="icon-mid"
            onClick={(event) => {
              event.stopPropagation();
              openCaseModal(null, node.id);
            }}
          />
        ) : null}
        <Dropdown overlay={treeMenu(node)} trigger={['click']}>
          <MoreOutlined className="icon-right" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
        {node.nodeType === 'directory' ? (
          <Popconfirm
            title="确认删除目录吗？"
            description="会连同子目录和用例一起删除"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(event) => {
              event?.stopPropagation?.();
              handleDeleteDirectory(node.id);
            }}
            onCancel={(event) => event?.stopPropagation?.()}
          >
            <DeleteOutlined className="icon-delete" onClick={(event) => event.stopPropagation()} />
          </Popconfirm>
        ) : (
          <Popconfirm
            title="确认删除该用例吗？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(event) => {
              event?.stopPropagation?.();
              deleteCaseById(node.id);
            }}
            onCancel={(event) => event?.stopPropagation?.()}
          >
            <DeleteOutlined className="icon-delete" onClick={(event) => event.stopPropagation()} />
          </Popconfirm>
        )}
      </span>
    </div>
  );

  const disabledDirectoryKeys = new Set(
    moveModal.type === 'directory' && moveModal.record
      ? [moveModal.record.id, ...getDescendantDirectoryIds(directoryTree, moveModal.record.id)]
      : [],
  );

  const renderSidePanel = () => {
    if (!currentCase) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择用例后编辑样式" />;
    }
    if (activePanel === 'icon') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">图标/贴纸</div>
          {ICON_GROUPS.map((group) => (
            <div className="functional-panel-group" key={group.label}>
              <div className="functional-field-label">{group.label}</div>
              <div className="functional-icon-grid side-panel">
                {group.items.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="functional-icon-item"
                    onClick={() => applyNodeIcon(item.value)}
                    title={item.label}
                  >
                    {renderIconPreview(item)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button block onClick={() => execNodeCommand('SET_NODE_ICON', [])}>清除当前节点图标</Button>
        </div>
      );
    }
    if (activePanel === 'theme') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">主题</div>
          <div className="functional-theme-tab">
            {THEME_CATEGORY_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={themeCategory === item.key ? 'active' : ''}
                onClick={() => setThemeCategory(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="functional-theme-grid">
            {filteredThemePresets.map((item) => (
              <button
                type="button"
                key={item.value}
                className={`functional-theme-card ${activeThemeValue === item.value ? 'active' : ''}`}
                onClick={() => applyTheme(item.value)}
              >
                <div
                  className="functional-theme-preview"
                  style={{
                    background: item.config.backgroundColor,
                    '--line-color': item.config.lineColor,
                    '--root-fill': item.config.root.fillColor,
                    '--second-fill': item.config.second.fillColor,
                    '--node-fill': item.config.node.fillColor,
                  }}
                >
                  <span className="theme-root" />
                  <span className="theme-second" />
                  <span className="theme-node top" />
                  <span className="theme-node bottom" />
                  <span className="theme-line" />
                  <span className="theme-branch top" />
                  <span className="theme-branch bottom" />
                </div>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (activePanel === 'structure') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">结构</div>
          {LAYOUT_GROUPS.map((group) => (
            <div className="functional-panel-group" key={group.title}>
              <div className="functional-field-label">{group.title}</div>
              <div className="functional-layout-grid">
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={`${group.title}-${item.label}`}
                    className={`functional-layout-card ${activeLayoutValue === item.value ? 'active' : ''}`}
                    onClick={() => applyLayout(item.value)}
                  >
                    <span className={`functional-layout-preview ${item.preview || ''}`} />
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="functional-panel-group">
            <div className="functional-field-label">展开层级</div>
            <div className="functional-side-row">
              <Button onClick={() => execCommand('EXPAND_ALL')}>展开全部</Button>
              <Button onClick={() => execCommand('UNEXPAND_ALL')}>收起全部</Button>
            </div>
            <div className="functional-side-row">
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 1)}>保留1级</Button>
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 2)}>保留2级</Button>
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 3)}>保留3级</Button>
            </div>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">当前节点</div>
            <div className="functional-side-row">
              <Button onClick={() => toggleActiveNodeExpand(true)}>展开当前</Button>
              <Button onClick={() => toggleActiveNodeExpand(false)}>收起当前</Button>
            </div>
            <Button block icon={<ReloadOutlined />} onClick={() => execCommand('RESET_LAYOUT')}>重排布局</Button>
            <Button block icon={<EnvironmentOutlined />} onClick={centerActiveNode}>当前节点居中</Button>
          </div>
        </div>
      );
    }
    if (activePanel === 'outline') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">大纲</div>
          <div className="functional-outline">
            {outline.map((item) => (
              <div key={item.key} style={{ paddingLeft: item.level * 12 }}>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activePanel === 'setting') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">设置</div>
          <div className="functional-check-list">
            <Checkbox onChange={(event) => updateMindConfig({ readonly: event.target.checked })}>只读模式</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ alwaysShowExpandBtn: event.target.checked })}>一直显示展开收起按钮</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ enableFreeDrag: event.target.checked })}>开启节点自由拖拽</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ isShowCreateChildBtnIcon: event.target.checked })}>显示快捷创建子节点按钮</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ mousewheelAction: event.target.checked ? 'zoom' : 'move' })}>鼠标滚轮改为缩放</Checkbox>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">统计</div>
            <div className="functional-stat-line">字数 {mindStats.wordCount}</div>
            <div className="functional-stat-line">节点 {mindStats.nodeCount}</div>
          </div>
        </div>
      );
    }
    if (activePanel === 'base') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">基础样式</div>
          <div className="functional-panel-group">
            <div className="functional-field-label">背景</div>
            {renderColorField('画布颜色', (color) => setThemeValue('backgroundColor', color))}
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">连线</div>
            {renderColorField('颜色', (color) => setThemeValue('lineColor', color))}
            <Select className="functional-side-control" placeholder="连线风格" onChange={(value) => setThemeValue('lineStyle', value)}>
              {LINE_STYLE_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
            {renderSliderField('粗细', 'themeLineWidth', (value) => setThemeValue('lineWidth', value), 1, 8)}
            <Checkbox onChange={(event) => setThemeValue('showLineMarker', event.target.checked)}>显示箭头</Checkbox>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">概要的连线</div>
            {renderColorField('颜色', (color) => setThemeValue('generalizationLineColor', color))}
            {renderSliderField('粗细', 'generalizationLineWidth', (value) => setThemeValue('generalizationLineWidth', value), 1, 8)}
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">关联线</div>
            {renderColorField('颜色', (color) => setThemeValue('associativeLineColor', color))}
            {renderSliderField('粗细', 'associativeLineWidth', (value) => setThemeValue('associativeLineWidth', value), 1, 8)}
          </div>
        </div>
      );
    }
    return (
      <div className="functional-panel-section">
        <div className="functional-side-title">节点样式</div>
        <div className="functional-panel-group">
          <div className="functional-field-label">文字</div>
          <Input
            className="functional-side-control"
            placeholder="输入节点文本后回车"
            onPressEnter={(event) => execNodeCommand('SET_NODE_TEXT', event.target.value)}
          />
          <div className="functional-side-row">
            <Select placeholder="字体" onChange={(value) => setNodeStyle('fontFamily', value)}>
              {FONT_FAMILY_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
            <Select placeholder="字号" onChange={(value) => setNodeStyle('fontSize', value)}>
              {FONT_SIZE_OPTIONS.map((item) => (
                <Option key={item} value={item}>{item}px</Option>
              ))}
            </Select>
          </div>
          <div className="functional-format-row">
            <Button onClick={() => setNodeStyle('color', '#1f2a44')}>A</Button>
            <Button onClick={() => toggleNodeStyle('fontWeight', 'bold', 'normal')}>B</Button>
            <Button onClick={() => toggleNodeStyle('fontStyle', 'italic', 'normal')}>I</Button>
            <Button onClick={() => toggleNodeStyle('textDecoration', 'underline', 'none')}>U</Button>
            <Button onClick={() => toggleNodeStyle('textDecoration', 'line-through', 'none')}>S</Button>
          </div>
          {renderColorField('文字颜色', (color) => setNodeStyle('color', color))}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">边框</div>
          {renderColorField('颜色', (color) => setNodeStyle('borderColor', color))}
          {renderSliderField('宽度', 'borderWidth', (value) => setNodeStyle('borderWidth', value), 0, 8)}
          {renderSliderField('圆角', 'borderRadius', (value) => setNodeStyle('borderRadius', value), 0, 24)}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">背景</div>
          {renderColorField('颜色', (color) => setNodeStyle('fillColor', color))}
          <div className="functional-side-row">
            <Button onClick={() => setNodeStyle('fillColor', 'transparent')}>透明</Button>
            <Button onClick={() => setNodeStyles({ fillColor: '#eef5ff', color: '#1f2a44' })}>浅蓝</Button>
          </div>
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">形状</div>
          <Select className="functional-side-control" placeholder="节点形状" onChange={(value) => execNodeCommand('SET_NODE_SHAPE', value)}>
            {SHAPE_OPTIONS.map((item) => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          {renderSliderField('水平内边距', 'paddingX', (value) => setNodeStyle('paddingX', value), 0, 40)}
          {renderSliderField('垂直内边距', 'paddingY', (value) => setNodeStyle('paddingY', value), 0, 24)}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">线条</div>
          {renderColorField('颜色', (color) => setNodeStyle('lineColor', color))}
          <Select className="functional-side-control" placeholder="线条样式" onChange={(value) => setNodeStyle('lineStyle', value)}>
            {LINE_STYLE_OPTIONS.map((item) => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          {renderSliderField('粗细', 'lineWidth', (value) => setNodeStyle('lineWidth', value), 1, 8)}
        </div>
      </div>
    );
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className={`functional-case-page ${treeCollapsed ? 'tree-collapsed' : ''}`}>
        <Tooltip title="展开功能用例树">
          <Button
            className="functional-tree-restore"
            icon={<DoubleRightOutlined />}
            onClick={() => handleTreeCollapse(false)}
          />
        </Tooltip>
        <div className="functional-panel functional-tree-panel">
          <div className="functional-panel-header">
            <strong>功能用例树</strong>
            <Tooltip title="收起功能用例树">
              <Button
                size="small"
                type="text"
                icon={<DoubleLeftOutlined />}
                onClick={() => handleTreeCollapse(true)}
              />
            </Tooltip>
          </div>
          <div className="functional-project-switch">
            <div style={{ height: 40, lineHeight: '40px' }}>
              {editingProject ? (
                <Select
                  style={{ marginLeft: 32, width: 150 }}
                  showSearch
                  allowClear
                  placeholder="请选择项目"
                  value={projectId}
                  autoFocus
                  onChange={(value) => {
                    if (value !== undefined) {
                      saveProject(value);
                    }
                    setEditingProject(false);
                    setCurrentDirectory(null);
                    setCurrentCase(null);
                    destroyMindMap();
                  }}
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {projects.map((item) => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              ) : (
                <div onClick={() => setEditingProject(true)}>
                  <Avatar
                    style={{ marginLeft: 8, marginRight: 6 }}
                    size="large"
                    src={getProject()?.avatar || CONFIG.PROJECT_AVATAR_URL}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 12,
                      fontWeight: 400,
                      fontSize: 14,
                    }}
                  >
                    {getProject()?.name || '请选择项目'}
                  </span>
                  <Switch
                    style={{ marginLeft: 12, cursor: 'pointer', lineHeight: '40px' }}
                    theme="outline"
                    size="16"
                    fill="#7ed321"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="functional-tree-search">
            <Input
              size="small"
              className="treeSearch"
              placeholder="输入目录或用例名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={async () => {
                if (!projectId) return;
                setAppliedKeyword(searchText.trim());
                await fetchTree(searchText.trim());
              }}
            />
            <Tooltip title="查询">
              <SearchOutlined
                className="directoryButton functional-search-action"
                onClick={async () => {
                  if (!projectId) return;
                  setAppliedKeyword(searchText.trim());
                  await fetchTree(searchText.trim());
                }}
              />
            </Tooltip>
            <Tooltip title="重置">
              <ReloadOutlined
                className="directoryButton functional-search-action"
                onClick={async () => {
                  if (!projectId) return;
                  setSearchText('');
                  setAppliedKeyword('');
                  await fetchTree('');
                }}
              />
            </Tooltip>
            <Tooltip title="点击可新建根目录，子目录需要在树上新建">
              <PlusOutlined className="directoryButton functional-root-add" onClick={() => projectId && openDirectoryModal()} />
            </Tooltip>
          </div>
          <div className="functional-panel-body">
            <Spin spinning={loadingTree}>
              {!projectId ? (
                <Empty description="请先选择项目" />
              ) : caseTree.length > 0 ? (
                <Tree
                  blockNode
                  treeData={caseTree}
                  selectedKeys={selectedKeys}
                  defaultExpandAll
                  titleRender={titleRender}
                  onDrop={handleDrop}
                  onSelect={(_, { node }) => {
                    if (node.nodeType === 'case') {
                      setCurrentDirectory(node.directory_id);
                      loadCase(node.raw);
                      return;
                    }
                    setCurrentDirectory(node.id || null);
                    setCurrentCase(null);
                    destroyMindMap();
                  }}
                />
              ) : (
                <Empty description="暂无功能用例" />
              )}
            </Spin>
          </div>
        </div>

        <div ref={editorPanelRef} className={`functional-panel functional-editor ${canvasFullscreen ? 'canvas-fullscreen' : ''}`}>
          <div className="functional-editor-stage">
            <div className="functional-editor-top">
              <div className="functional-toolbar-group">
                <Tooltip title="回退">
                  <Button icon={<span>↶</span>} disabled={!currentCase} onClick={() => execCommand('BACK')} />
                </Tooltip>
                <Tooltip title="前进">
                  <Button icon={<span>↷</span>} disabled={!currentCase} onClick={() => execCommand('FORWARD')} />
                </Tooltip>
                <Tooltip title={formatPainterActive ? '格式刷进行中，点击可取消' : '格式刷'}>
                  <Button
                    icon={<FormatPainterOutlined />}
                    className={formatPainterActive ? 'functional-toolbar-active' : ''}
                    disabled={!currentCase}
                    onClick={() => (formatPainterActive ? stopFormatPainter() : startFormatPainter())}
                  />
                </Tooltip>
                <Tooltip title="同级节点">
                  <Button icon={<FileAddOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_NODE')} />
                </Tooltip>
                <Tooltip title="子节点">
                  <Button icon={<PlusOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_CHILD_NODE')} />
                </Tooltip>
                <Tooltip title="父节点">
                  <Button icon={<DoubleLeftOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_PARENT_NODE')} />
                </Tooltip>
                <Tooltip title="前插节点">
                  <Button icon={<span>↑</span>} disabled={!currentCase} onClick={() => execCommand('INSERT_BEFORE')} />
                </Tooltip>
                <Tooltip title="后插节点">
                  <Button icon={<span>↓</span>} disabled={!currentCase} onClick={() => execCommand('INSERT_AFTER')} />
                </Tooltip>
                <Tooltip title="删除节点">
                  <Button icon={<DeleteOutlined />} disabled={!currentCase} onClick={() => execCommand('REMOVE_CURRENT_NODE')} />
                </Tooltip>
                <Tooltip title="图片">
                  <Button icon={<PictureOutlined />} disabled={!currentCase} onClick={openImage} />
                </Tooltip>
                <Tooltip title="图标">
                  <Button
                    icon={<SmileOutlined />}
                    disabled={!currentCase}
                    className={activePanel === 'icon' && panelOpen ? 'functional-toolbar-active' : ''}
                    onClick={() => {
                      setActivePanel('icon');
                      setPanelOpen(true);
                    }}
                  />
                </Tooltip>
                <Tooltip title="超链接">
                  <Button icon={<LinkOutlined />} disabled={!currentCase} onClick={openLink} />
                </Tooltip>
                <Tooltip title="备注">
                  <Button icon={<FileTextOutlined />} disabled={!currentCase} onClick={openNote} />
                </Tooltip>
                <Tooltip title="概要">
                  <Button icon={<AppstoreOutlined />} disabled={!currentCase} onClick={() => execCommand('ADD_GENERALIZATION')} />
                </Tooltip>
                <Tooltip title="删除概要">
                  <Button icon={<CloseCircleOutlined />} disabled={!currentCase} onClick={() => execCommand('REMOVE_GENERALIZATION')} />
                </Tooltip>
                <Tooltip title="公式">
                  <Button icon={<span>Σ</span>} disabled={!currentCase} onClick={openFormulaModal} />
                </Tooltip>
                <Tooltip title="附件">
                  <Button icon={<PaperClipOutlined />} disabled={!currentCase} onClick={openAttachment} />
                </Tooltip>
              </div>

              <div className="functional-toolbar-group">
                <Tooltip title="导入(JSON/XMind)">
                  <Button icon={<UploadOutlined />} disabled={!currentCase} onClick={triggerImport} />
                </Tooltip>
                <Tooltip title="导出">
                  <Button icon={<DownloadOutlined />} disabled={!currentCase} onClick={openExportModal} />
                </Tooltip>
                <Tooltip title="删除用例">
                  <Button danger icon={<DeleteOutlined />} disabled={!currentCase} onClick={confirmDeleteCurrentCase} />
                </Tooltip>
                <Tooltip title="AI 生成用例">
                  <Button
                    className="functional-ai-trigger"
                    icon={<span className="ai-icon-text">AI</span>}
                    disabled={!currentCase || !projectId}
                    onClick={openSkillAIModal}
                  />
                </Tooltip>
              </div>
              <div className="functional-toolbar-save">
                <Tooltip title="保存">
                  <Button icon={<SaveOutlined />} loading={saving} disabled={!currentCase} onClick={saveMind} />
                </Tooltip>
              </div>
            </div>

            <div className={`functional-canvas-shell ${panelOpen ? 'panel-open' : ''}`}>
              <div className="functional-canvas-area">
                <div className="functional-case-name">
                  <span className="functional-case-title">{currentCase?.title || '功能用例脑图'}</span>
                  {currentCase ? (
                    <span className="functional-case-meta">
                      {`创建人 ${currentCase.create_user_name || currentCase.creator_name || '-'} · 创建时间 ${formatTreeTime(currentCase.created_at) || '-'}`}
                    </span>
                  ) : null}
                </div>
                {currentCase ? (
                  <div ref={mindContainerRef} className="functional-mind" />
                ) : (
                  <div className="functional-empty">
                    <Empty description="选择或新增一个功能用例后开始编辑" />
                  </div>
                )}
                {loadingCase && currentCase ? (
                  <div className="functional-case-loading-mask">
                    <Spin size="large" tip="正在加载用例画布..." />
                  </div>
                ) : null}
                <div className="functional-bottom-bar">
                  <Button size="small" icon={<EnvironmentOutlined />} disabled={!currentCase} onClick={fitView} />
                  <Button
                    size="small"
                    icon={canvasFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    disabled={!currentCase}
                    onClick={toggleCanvasFullscreen}
                  />
                  <Button size="small" icon={<ZoomOutOutlined />} disabled={!currentCase} onClick={() => updateScale(scale - 10)} />
                  <span className="functional-scale">{scale} %</span>
                  <Button size="small" icon={<ZoomInOutlined />} disabled={!currentCase} onClick={() => updateScale(scale + 10)} />
                  <Button size="small" icon={<ReloadOutlined />} disabled={!currentCase} onClick={resetView} />
                </div>
                <div className="functional-status-bar">
                  字数 {mindStats.wordCount}
                  <span>节点 {mindStats.nodeCount}</span>
                </div>
              </div>

              <Tooltip title="展开功能面板">
                <button
                  type="button"
                  className="functional-drawer-trigger"
                  onClick={() => setPanelOpen(true)}
                >
                  <LeftOutlined />
                </button>
              </Tooltip>
              <div className="functional-right-tabs">
                {SIDE_PANELS.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={panelOpen && activePanel === item.key ? 'active' : ''}
                    onClick={() => {
                      if (activePanel === item.key) {
                        setPanelOpen((open) => !open);
                        return;
                      }
                      setActivePanel(item.key);
                      setPanelOpen(true);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className={`functional-side-panel ${panelOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="functional-side-close"
                  onClick={() => setPanelOpen(false)}
                >
                  ×
                </button>
                {renderSidePanel()}
              </div>
              {mindContextMenu.open ? (
                <div
                  className="functional-mind-contextmenu"
                  style={{ left: mindContextMenu.x, top: mindContextMenu.y }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {mindContextMenu.type === 'node' ? (
                    <>
                      <button type="button" onClick={() => clearNodeIcons(mindContextMenu.node)}>移除节点图标</button>
                      <button type="button" onClick={() => toggleNodeExpand(true, mindContextMenu.node)}>展开子节点</button>
                      <button type="button" onClick={() => toggleNodeExpand(false, mindContextMenu.node)}>折叠子节点</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={clearAllNodeIcons}>移除所有节点图标</button>
                      <button type="button" onClick={expandAllNodes}>展开所有节点</button>
                      <button type="button" onClick={collapseAllNodes}>折叠所有节点</button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={importFileRef}
        type="file"
        accept="application/json,.json,application/vnd.xmind.workbook,.xmind"
        hidden
        onChange={importJson}
      />

      <Modal
        title={directoryModal.record ? '编辑目录' : '新增目录'}
        open={directoryModal.open}
        onOk={submitDirectory}
        onCancel={() => setDirectoryModal({ open: false, record: null, parent: null })}
      >
        <Input placeholder="请输入目录名称" value={directoryName} onChange={(e) => setDirectoryName(e.target.value)} />
      </Modal>

      <Modal
        title={caseModal.record ? '编辑功能用例' : '新增功能用例'}
        open={caseModal.open}
        onOk={submitCase}
        onCancel={() => setCaseModal({ open: false, record: null, directoryId: null })}
      >
        <Input placeholder="请输入功能用例名称" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
      </Modal>

      <Modal
        title={moveModal.type === 'directory' ? '移动/排序目录' : '移动/排序用例'}
        open={moveModal.open}
        onOk={submitMove}
        onCancel={() => setMoveModal({ open: false, type: '', record: null })}
      >
        {moveModal.type === 'directory' ? (
          <TreeSelect
            style={{ width: '100%', marginBottom: 12 }}
            treeData={treeToSelectOptions(directoryTree, disabledDirectoryKeys)}
            value={moveParent}
            allowClear
            treeDefaultExpandAll
            placeholder="请选择父目录，不选即根目录"
            onChange={setMoveParent}
          />
        ) : (
          <TreeSelect
            style={{ width: '100%', marginBottom: 12 }}
            treeData={directoryOptions}
            value={moveDirectoryId}
            treeDefaultExpandAll
            placeholder="请选择目标目录"
            onChange={setMoveDirectoryId}
          />
        )}
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          value={moveSortIndex}
          placeholder="排序号，越小越靠前"
          onChange={(value) => setMoveSortIndex(value || 0)}
        />
      </Modal>

      <Modal
        title="设置超链接"
        open={linkModal.open}
        onOk={submitLink}
        onCancel={() => setLinkModal({ open: false })}
      >
        <Input style={{ marginBottom: 12 }} placeholder="链接标题" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
        <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
      </Modal>

      <Modal
        title="设置备注"
        open={noteModal.open}
        onOk={submitNote}
        onCancel={() => setNoteModal({ open: false })}
      >
        <Input.TextArea rows={5} placeholder="请输入节点备注" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
      </Modal>

      <Modal
        title="设置图片"
        open={imageModal.open}
        onOk={submitImage}
        onCancel={() => setImageModal({ open: false })}
      >
        <Input placeholder="请输入图片 URL，留空可移除图片" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </Modal>

      <Modal
        title="设置附件"
        open={attachmentModal.open}
        onOk={submitAttachment}
        onCancel={() => setAttachmentModal({ open: false })}
      >
        <Input style={{ marginBottom: 12 }} placeholder="附件名称" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} />
        <Input placeholder="附件 URL" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
      </Modal>

      <Modal
        title="AI 生成测试用例"
        open={aiModal.open}
        onCancel={closeAIModal}
        onOk={submitAIGenerate}
        okText="开始润色"
        cancelText="取消"
        confirmLoading={aiModal.loading}
        width={720}
        className="functional-ai-modal"
      >
        <div className="functional-ai-modal-body">
          <div className="functional-ai-tip">
            支持上传需求截图、输入需求描述，并补充你的生成规范。生成完成后会直接覆盖当前画布内容，请检查后再保存。
          </div>
          <div className="functional-ai-field">
            <div className="functional-ai-label">需求文档截图</div>
            <Upload
              accept={AI_UPLOAD_ACCEPT}
              listType="picture-card"
              fileList={aiModal.fileList}
              beforeUpload={handleAIUpload}
              onRemove={removeAIUpload}
              multiple
            >
              {aiModal.fileList.length >= 6 ? null : (
                <div className="functional-ai-upload-button">
                  <UploadOutlined />
                  <span>上传截图</span>
                </div>
              )}
            </Upload>
          </div>
          <div className="functional-ai-field">
            <div className="functional-ai-label">需求描述</div>
            <Input.TextArea
              rows={5}
              placeholder="请输入需求背景、页面流程、前置条件、校验点等内容"
              value={aiModal.requirementText}
              onChange={(event) => setAiModal((prev) => ({ ...prev, requirementText: event.target.value }))}
            />
          </div>
          <div className="functional-ai-field">
            <div className="functional-ai-label">生成要求 / 返回格式要求</div>
            <Input.TextArea
              rows={6}
              placeholder="例如：按前置条件/操作步骤/预期结果组织；覆盖正常、异常、边界场景；优先级节点使用 priority 图标；返回结果便于直接生成 xmind 用例"
              value={aiModal.instructionText}
              onChange={(event) => setAiModal((prev) => ({ ...prev, instructionText: event.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="技能生成测试用例"
        open={skillAiModal.open}
        onCancel={closeSkillAIModal}
        width={760}
        className="functional-ai-modal"
        footer={[
          <Button key="cancel" onClick={closeSkillAIModal}>
            取消
          </Button>,
          skillAiStep > 0 && skillAiStep < 2 ? (
            <Button key="prev" onClick={handleSkillStepPrev} disabled={skillAiModal.polling || skillAiModal.loading}>
              上一步
            </Button>
          ) : null,
          skillAiStep < 1 ? (
            <Button key="next" type="primary" onClick={handleSkillStepNext} disabled={skillAiModal.polling || skillAiModal.loading}>
              下一步
            </Button>
          ) : null,
          skillAiStep === 1 ? (
            <Button
              key="start"
              type="primary"
              onClick={submitSkillAIGenerate}
              loading={skillAiModal.loading}
              disabled={skillAiModal.polling}
            >
              {skillAiModal.polling ? '生成中' : '开始生成'}
            </Button>
          ) : null,
          skillAiStep === 2 ? (
            <Button key="done" type="primary" onClick={resetSkillAIModal} disabled={skillAiModal.polling || skillAiModal.loading}>
              完成
            </Button>
          ) : null,
        ]}
      >
        <div className="functional-ai-modal-body">
          <Steps
            current={skillAiStep}
            items={skillStepItems}
            className="functional-ai-steps"
            style={{ marginBottom: 16 }}
          />
          {skillAiStep < 2 ? (
            <div className="functional-ai-tip">
              这条链路会把需求截图、需求文本、已选技能文档和系统规范一并送到后端任务目录，生成 Markdown 用例并由后端转换为画布数据覆盖当前画布。
            </div>
          ) : null}

          {skillAiStep === 0 ? (
            <>
              <div className="functional-ai-field">
                <div className="functional-ai-label">需求文档截图</div>
                <Upload
                  accept={AI_UPLOAD_ACCEPT}
                  listType="picture-card"
                  fileList={skillAiModal.fileList}
                  beforeUpload={handleSkillAIUpload}
                  onRemove={removeSkillAIUpload}
                  multiple
                  disabled={skillAiModal.polling}
                >
                  {skillAiModal.fileList.length >= 6 ? null : (
                    <div className="functional-ai-upload-button">
                      <UploadOutlined />
                      <span>上传截图</span>
                    </div>
                  )}
                </Upload>
              </div>
              <div className="functional-ai-field">
                <div className="functional-ai-label">需求描述</div>
                <Input.TextArea
                  rows={5}
                  placeholder="请输入需求背景、页面流程、前置条件、校验点等内容"
                  value={skillAiModal.requirementText}
                  disabled={skillAiModal.polling}
                  onChange={(event) => setSkillAiModal((prev) => ({ ...prev, requirementText: event.target.value }))}
                />
              </div>
            </>
          ) : null}

          {skillAiStep === 1 ? (
            <>
              <div className="functional-ai-field">
                <div className="functional-ai-label">选择技能 / 文档</div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="选择当前用户可见的技能文档或普通文档"
                  options={skillDocOptions}
                  value={skillAiModal.selectedDocIds}
                  loading={loadingSkillDocs}
                  disabled={skillAiModal.polling}
                  onChange={(value) => setSkillAiModal((prev) => ({ ...prev, selectedDocIds: value }))}
                />
              </div>
              <div className="functional-ai-field">
                <div className="functional-ai-label">提示词 / 生成目标</div>
                <Input.TextArea
                  rows={6}
                  placeholder="例如：根据上传的需求文档生成测试用例，并参考已选技能补齐正常、异常和边界场景"
                  value={skillAiModal.instructionText}
                  disabled={skillAiModal.polling}
                  onChange={(event) => setSkillAiModal((prev) => ({ ...prev, instructionText: event.target.value }))}
                />
              </div>
            </>
          ) : null}

          {skillAiStep === 2 ? (
            <>
              <div className="functional-ai-field">
                <div className="functional-ai-label">任务进度</div>
                <div style={{ padding: 12, background: '#f7f9fc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <Steps
                    current={resolveSkillTaskProgressIndex()}
                    size="small"
                    direction="vertical"
                    items={skillTaskProgressItems}
                  />
                  <div style={{ color: '#1f2937', marginTop: 10 }}>{skillAiModal.stageText || '等待执行'}</div>
                  {skillAiModal.reviewProvider ? (
                    <div style={{ color: '#6b7280', marginTop: 4 }}>
                      {`审查模型：${skillAiModal.reviewProvider} · 审查轮次：${skillAiModal.reviewRounds || 0}`}
                    </div>
                  ) : null}
                  {skillAiModal.errorMessage ? (
                    <div style={{ color: '#dc2626', marginTop: 4 }}>{skillAiModal.errorMessage}</div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={exportModal.open}
        footer={null}
        centered
        width={800}
        className="functional-export-modal"
        onCancel={() => setExportModal((prev) => ({ ...prev, open: false }))}
      >
        <div className="functional-export-content">
          <div className="functional-export-types">
            {EXPORT_OPTIONS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={exportModal.type === item.key ? 'active' : ''}
                onClick={() => setExportModal((prev) => ({ ...prev, type: item.key }))}
              >
                <span className={`functional-export-type-icon ${item.key}`}>{item.icon}</span>
                <strong>{item.label}</strong>
                {exportModal.type === item.key ? <span className="functional-export-check">✓</span> : null}
              </button>
            ))}
          </div>
          <div className="functional-export-main">
            <div className="functional-export-header">
              <span>导出文件名称</span>
              <Input
                value={exportModal.name}
                onChange={(event) => setExportModal((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="请输入导出文件名称"
              />
            </div>
            <div className="functional-export-body">
              {(() => {
                const current = EXPORT_OPTIONS.find((item) => item.key === exportModal.type) || EXPORT_OPTIONS[0];
                return (
                  <>
                    <div className="functional-export-row">
                      <span>格式</span>
                      <strong>{current.format}</strong>
                    </div>
                    <div className="functional-export-row">
                      <span>说明</span>
                      <strong>{current.description}</strong>
                    </div>
                    <div className="functional-export-row">
                      <span>选项</span>
                      <strong>{current.option}</strong>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="functional-export-footer">
              <Button onClick={() => setExportModal((prev) => ({ ...prev, open: false }))}>取消</Button>
              <Button type="primary" onClick={submitExport}>导出</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="插入公式"
        open={formulaModal.open}
        onOk={submitFormula}
        onCancel={() => setFormulaModal({ open: false })}
      >
        <Input.TextArea rows={4} placeholder="请输入 LaTeX 公式，例如：E = mc^2" value={formulaText} onChange={(e) => setFormulaText(e.target.value)} />
      </Modal>
    </PageContainer>
  );
};

export default connect(({ project }) => ({ project }))(FunctionalCase);
