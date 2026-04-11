import { registerValueSourceHandler } from './registry';
import {
  literalHandler,
  variableHandler,
  objectVariableHandler,
  dataHandler,
  randomHandler,
} from './handlers';

registerValueSourceHandler(literalHandler);
registerValueSourceHandler(variableHandler);
registerValueSourceHandler(objectVariableHandler);
registerValueSourceHandler(dataHandler);
registerValueSourceHandler(randomHandler);
