"use client";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/** Reads the theme currently applied on the page. */
function currentTheme(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const popup = { popup: "morrow-alert", confirmButton: "morrow-alert-ok" };

/** Shows a short success alert in the active theme. */
export function notifySuccess(title: string) {
  return Swal.fire({
    icon: "success",
    title,
    theme: currentTheme(),
    timer: 2200,
    timerProgressBar: true,
    showConfirmButton: false,
    heightAuto: false,
    customClass: popup,
  });
}

/** Shows an error alert in the active theme until it is dismissed. */
export function notifyError(message: string) {
  return Swal.fire({
    icon: "error",
    title: "Something went wrong",
    text: message,
    theme: currentTheme(),
    confirmButtonText: "OK",
    heightAuto: false,
    customClass: popup,
  });
}
