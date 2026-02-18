import { registerValueSourceHandler } from './registry';
import { literalHandler, variableHandler, dataHandler, randomHandler } from './handlers';

registerValueSourceHandler(literalHandler);
registerValueSourceHandler(variableHandler);
registerValueSourceHandler(dataHandler);
registerValueSourceHandler(randomHandler);
