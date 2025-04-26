import { Location } from "react-router-dom";

function UpdateTitle(location: Location<any>) {
  let title = "FileShare - Secure File Sharing Made Easy";
  const path = location.pathname;

  // Set specific titles based on route
  if (path === "/") {
    title =
      "FileShare - Secure File Sharing Made Easy | Share Files Up to 2GB Free";
  } else if (path === "/upload") {
    title = "Upload & Share Files Securely | FileShare";
  } else if (path.includes("/file/")) {
    title = "Download Secure File | FileShare";
  } else if (path.includes("/payment/")) {
    title = "Upgrade Your File Options | FileShare";
  } else if (path === "*") {
    title = "Page Not Found | FileShare";
  }

  // Update document title
  document.title = title;
}

export default UpdateTitle;
