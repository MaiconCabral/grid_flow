"use client";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function currentTheme(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const popup = { popup: "morrow-alert", confirmButton: "morrow-alert-ok" };

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
