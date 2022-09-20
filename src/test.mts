import { run } from '@gjsify/unit';

import errorHandlerTestSuite from './error-handler.spec.js';
import defineCustomEventTargetTestSuite from './event-target-define-custom.spec.js';
import eventAttributeTestSuite from './event-attribute-handler.spec.js';
import eventTargetTestSuite from './event-target.spec.js';
import eventTestSuite from './event.spec.js';
import warningHandlerTestSuite from './warning-handler.spec.js';

run({
    defineCustomEventTargetTestSuite,
    eventAttributeTestSuite,
    eventTestSuite,
    eventTargetTestSuite,
    warningHandlerTestSuite,
    errorHandlerTestSuite,
});