import { HANDLE_TYPE, HANDLE_TYPES } from './handleTypes';
import NodeHandleTooltip from './NodeHandleTooltip';

const ERROR_MESSAGE = 'Resource type not found';

const NodeHandle = ({
  handleType,
  resourceTypeId,
  fieldName,
  required,
  showFieldStatus = true,
  hasConnection,
  isValidConnectionTarget,
  placement,
  ...handleProps
}: {
  handleType: string;
  resourceTypeId?: string | null;
  fieldName?: string;
  required?: boolean | null;
  showFieldStatus?: boolean;
  hasConnection?: boolean;
  isValidConnectionTarget?: boolean;
  placement?: string;
  [key: string]: unknown;
}) => {
  const Component =
    HANDLE_TYPES[handleType] ?? HANDLE_TYPES[HANDLE_TYPE.DEFAULT];
  const isError = handleType === HANDLE_TYPE.ERROR;
  const isRemoteReference = handleType === HANDLE_TYPE.REMOTE_REFERENCE;

  const handle = (
    <Component
      className="node-handle nodrag"
      hasConnection={hasConnection}
      isValidConnectionTarget={isValidConnectionTarget}
      {...handleProps}
    />
  );

  return (
    <NodeHandleTooltip
      resourceTypeId={isError ? null : resourceTypeId}
      errorMessage={isError ? ERROR_MESSAGE : null}
      fieldName={fieldName}
      required={required}
      isRemoteReference={isRemoteReference}
      showFieldStatus={showFieldStatus}
      placement={placement}
    >
      {handle}
    </NodeHandleTooltip>
  );
};

export default NodeHandle;
