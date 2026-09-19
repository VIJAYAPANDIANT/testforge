import React from 'react';
import { TestDsl } from '../../types';
import { TestBuilderCanvas } from '../test-builder/TestBuilderCanvas';

interface TestStepEditorProps {
  testCaseId: string;
  testCaseName: string;
  testCaseDescription?: string;
  initialDsl?: TestDsl;
  onSaveSuccess?: () => void;
}

export const TestStepEditor: React.FC<TestStepEditorProps> = ({
  testCaseId,
  testCaseName,
  testCaseDescription,
  initialDsl,
  onSaveSuccess,
}) => {
  return (
    <TestBuilderCanvas
      testCaseId={testCaseId}
      testCaseName={testCaseName}
      testCaseDescription={testCaseDescription}
      initialDsl={initialDsl}
      onSaveSuccess={onSaveSuccess}
    />
  );
};
