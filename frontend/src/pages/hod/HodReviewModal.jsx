import Modal from "../../components/Modal";
import ApplicationDetails from "../../components/ApplicationDetails";
import EditPermissionButton from "../../components/EditPermissionButton";

// canDelete: delete the application; canAllowEdit: let the student edit it
export default function HodReviewModal({
  selected,
  setSelected,
  canDelete = false,
  canAllowEdit = false,
  onUpdated,
  onDelete,
}) {
  const close = () => setSelected(null);

  return (
    <Modal
      title="Internship Application"
      onClose={close}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {canAllowEdit && (
            <EditPermissionButton
              application={selected}
              onChange={(updated) => {
                setSelected(updated);
                onUpdated?.(updated);
              }}
            />
          )}
          {canDelete && (
            <button type="button" onClick={() => onDelete?.(selected)} className="btn btn-danger">
              Delete
            </button>
          )}
          <button type="button" onClick={close} className="btn btn-secondary">
            Close
          </button>
        </div>
      }
    >
      <ApplicationDetails app={selected} />
    </Modal>
  );
}
