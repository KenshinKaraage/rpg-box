import { registerUIAction } from './index';
import { SetPropertyAction } from './SetPropertyAction';
import { SetVisibilityAction } from './SetVisibilityAction';
import { PlayAnimationAction } from './PlayAnimationAction';
import { CallFunctionAction } from './CallFunctionAction';
import { NavigateAction } from './NavigateAction';

registerUIAction('uiSetProperty', SetPropertyAction);
registerUIAction('uiSetVisibility', SetVisibilityAction);
registerUIAction('uiPlayAnimation', PlayAnimationAction);
registerUIAction('uiCallFunction', CallFunctionAction);
registerUIAction('uiNavigate', NavigateAction);
