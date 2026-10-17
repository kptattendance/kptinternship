import Modal from "../../components/Modal";
import ApplicationDetails from "../../components/ApplicationDetails";

export default function HodReviewModal({ selected, setSelected }) {
  const close = () => setSelected(null);

  return (
    <Modal
      title="Internship Application"
      onClose={close}
      footer={
        <div className="flex justify-end">
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
