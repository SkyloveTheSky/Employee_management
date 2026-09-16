import axios from "axios";

function csrfToken() {
    return decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");
}

export function inboxHeaders() {
    return {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": csrfToken(),
    };
}

export function inboxGet(url) {
    return axios.get(url, { headers: inboxHeaders() });
}

export function inboxDelete(url) {
    return axios.delete(url, { headers: inboxHeaders() });
}
