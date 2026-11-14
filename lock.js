(function () {
  const MY_PIN = "0212"; // Set your PIN here

  let isUnlocked = false;
  try {
    isUnlocked = sessionStorage.getItem("app_unlocked") === "1";
  } catch (e) {
    isUnlocked = false;
  }
  if (isUnlocked) return;

  // Hide app content immediately before it renders
  const style = document.createElement("style");
  style.id = "lock-hide";
  style.textContent = "body > *:not(#pin-lock-screen) { display: none !important; }";
  (document.head || document.documentElement).appendChild(style);

  function showLock() {
    if (document.getElementById("pin-lock-screen")) return;

    const screen = document.createElement("div");
    screen.id = "pin-lock-screen";
    screen.style.cssText =
      "position:fixed;inset:0;background:#111;color:#fff;display:flex;justify-content:center;align-items:center;font-family:sans-serif;z-index:999999;";
    screen.innerHTML = `
      <div style="background:#1e1e1e;padding:28px;border-radius:14px;text-align:center;width:300px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <h2 style="margin:0 0 14px;font-size:20px;">Enter PIN</h2>
        <input id="pin-input" type="password" inputmode="numeric" placeholder="PIN" autofocus style="width:100%;padding:12px;font-size:18px;text-align:center;border-radius:8px;border:none;outline:none;margin-bottom:12px;box-sizing:border-box;">
        <button id="pin-btn" type="button" style="width:100%;padding:12px;font-size:16px;border:none;border-radius:8px;background:#4caf50;color:#fff;cursor:pointer;font-weight:bold;">Unlock</button>
        <p id="pin-err" style="color:#ff5252;font-size:14px;margin:10px 0 0;min-height:18px;"></p>
      </div>
    `;
    document.body.prepend(screen);

    const input = document.getElementById("pin-input");
    const err = document.getElementById("pin-err");

    function check() {
      if (input.value === MY_PIN) {
        try {
          sessionStorage.setItem("app_unlocked", "1");
        } catch (e) {}
        style.remove();
        screen.remove();
      } else {
        err.textContent = "Incorrect PIN. Please try again.";
        input.value = "";
        input.focus();
      }
    }

    document.getElementById("pin-btn").addEventListener("click", check);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") check();
    });
  }

  if (document.body) {
    showLock();
  } else {
    document.addEventListener("DOMContentLoaded", showLock);
  }
})();
