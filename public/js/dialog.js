// Used in: views/events/index.ejs, views/events/show.ejs
// this file is used to show a dialog box to confirm critical actions like delete or publish

let currentFormId = null;
let dialog = null;

document.addEventListener("DOMContentLoaded", () => {
  dialog = document.getElementById("confirmationDialog");
});

function showDialog(config) {
  currentFormId = config.formId;

  document.getElementById("dialogTitle").textContent = config.title;
  document.getElementById("dialogMessage").textContent = config.message;

  const confirmButton = document.getElementById("confirmButton");
  confirmButton.textContent = config.actionText;
  confirmButton.className = config.actionClass;

  dialog.showModal();
}

function closeDialog() {
  dialog.close();
}

function confirmAction() {
  document.getElementById(currentFormId).submit();
  dialog.close();
}

// Helper functions
function confirmDelete(eventId) {
  showDialog({
    formId: `deleteForm${eventId}`,
    title: "Confirm Delete",
    message: "Are you sure you want to delete this event? This action cannot be undone.",
    actionText: "Delete",
    actionClass: "delete",
  });
}

function confirmPublish(eventId) {
  showDialog({
    formId: `publishForm${eventId}`,
    title: "Confirm Publish",
    message:
      "Are you sure you want to publish this event? Once published, the event details will be visible to the public and won't be able to modify the event.",
    actionText: "Publish",
    actionClass: "publish",
  });
}
