// レジストリ登録（副作用 import — アプリ起動時に実行）
import '@/engine/actions/register';
import './registry/register';

export { EventTemplateList } from './components/EventTemplateList';
export { EventTemplateEditor } from './components/EventTemplateEditor';
export { ActionBlockEditor } from './components/ActionBlockEditor';
export { ActionSelector } from './components/ActionSelector';
export { TemplateArgEditor } from './components/TemplateArgEditor';
