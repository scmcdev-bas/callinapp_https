
$(function () {

  const speakerDevices = document.getElementById("speaker-devices");
  const ringtoneDevices = document.getElementById("ringtone-devices");
  const custumerId = document.getElementById("custumerId");
  const outgoingCallHangupButton = document.getElementById(
    "button-hangup-outgoing"
  );
  const incomingCallDiv = document.getElementById("incoming-call");
  const incomingCallHangupButton = document.getElementById(
    "button-hangup-incoming"
  );
  const incomingCallAcceptButton = document.getElementById(
    "button-accept-incoming"
  );
  const incomingCallRejectButton = document.getElementById(
    "button-reject-incoming"
  );
  const incomingPhoneNumberEl = document.getElementById("incoming-number");
  const urlParams = new URLSearchParams(window.location.search);

  const numpad = document.getElementById("numpad");
  const incomingCallAcceptControler = document.getElementById(
    "incomingCallAcceptControler"
  );
  const buttoncallcontainner = document.getElementById("buttoncallcontainner");
  const buttonincomingcallcontainner = document.getElementById(
    "buttonincomingcallcontainner"
  );
  const popupButton = document.getElementById("popupButton");
  const popup = document.getElementById("popup");
  const closeButton = document.getElementById("closeButton");
  const btnStartCall = document.getElementById("startcall");
  const btnClosePopup = document.getElementById("close-errorpopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const errorMessage = document.getElementById("error");
  const logoutBtn = document.getElementById("logout");
  const customerIdLabel = document.getElementById("custumerId");
  let callStartTime = null;
  let timerInterval = null;
  startupClient();
  btnClosePopup.addEventListener("click", (e) => {
    closePopup();
  });
  btnStartCall.addEventListener("click", (e) => {
    startcall(e);
  });
  popupButton.addEventListener("click", (e) => {
    popup.style.display = "block";
    errorMessage.classList.add("hide");
  });

  closeButton.addEventListener("click", () => {
    popup.style.display = "none";
    outgoingCallHangupButton.click();
    errorMessage.classList.add("hide");
  });
  cancelBtn.addEventListener("click", () => {
    popup.style.display = "none";
    outgoingCallHangupButton.click();
  });
  // Close the popup when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.style.display = "none";
      outgoingCallHangupButton.click();
    }
  });
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("id");
    window.location.href = "/login";
  });
  // Define the DTMF button elements in an array

  // Decode the Base64 encoded value
  try {
    phoneNumberLabel.value = formattedTel;
    console.log(formattedTel);
  } catch (error) {
    console.log(error);
  }

  let device;
  let token;

  if (localStorage.getItem("id") === null) {
    window.location.href = "/login";
  }
  // Event Listeners

  getAudioDevices();
  speakerDevices.addEventListener("change", updateOutputDevice);
  ringtoneDevices.addEventListener("change", updateRingtoneDevice);

  // SETUP STEP 1:
  // Browser client should be started after a user gesture
  // to avoid errors in the browser console re: AudioContext
  // SETUP STEP 2: Request an Access Token
  async function startupClient() {
    log("Requesting Access Token...");
    var phonenumber = localStorage.getItem("id");
    //var phonenumber = document.getElementById("clientPhoneNumber").value;

    try {
      const data = await $.getJSON(`/token?callerId=${phonenumber}`);
      log("Got a token.");
      token = data.token;
      console.log(token);
      intitializeDevice();
    } catch (err) {
      console.log(err);
      log("An error occurred. See your browser console for more information.");
    }
  }

  // SETUP STEP 3:
  // Instantiate a new Twilio.Device
  function intitializeDevice() {
    log("Initializing device");
    device = new Twilio.Device(token, {
      logLevel: 1,
      // Set Opus as our preferred codec. Opus generally performs better, requiring less bandwidth and
      // providing better audio quality in restrained network conditions.
      codecPreferences: ["opus", "pcmu"],
    });

    addDeviceListeners(device);

    // Device must be registered in order to receive incoming calls
    device.register();
  }

  // SETUP STEP 4:
  // Listen for Twilio.Device states
  function addDeviceListeners(device) {
    device.on("registered", function () {
      log("Twilio.Device Ready to make and receive calls!");
    });

    device.on("error", function (error) {
      log("Twilio.Device Error: " + error.message);
    });

    device.on("incoming", handleIncomingCall);

    device.audio.on("deviceChange", updateAllAudioDevices.bind(device));

    // Show audio selection UI if it is supported by the browser.
    if (device.audio.isOutputSelectionSupported) {
    }
  }

  // MAKE AN OUTGOING CALL
  function updateCallTimer() {
    if (callStartTime) {
      const currentTime = new Date();
      const elapsedTime = Math.floor((currentTime - callStartTime) / 1000); // in seconds

      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;

      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      document.getElementById("call-timer").textContent = formattedTime;
    }
  }
  function updateCallTimerIncomingCall() {
    if (callStartTime) {
      const currentTime = new Date();
      const elapsedTime = Math.floor((currentTime - callStartTime) / 1000); // in seconds

      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;

      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      document.getElementById("call-timer-incomingcall").textContent =
        formattedTime;
    }
  }
  async function makeOutgoingCall() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
    } catch {
      lat = "13.7449955";
      lng = "100.5413548";
    }
    const params = {
      To: "",
      lat: lat,
      lng: lng,
    };

    if (device) {
      // Assuming 'device' is defined somewhere
      log(`Attempting to call ${params.To} ...`);

      // Twilio.Device.connect() returns a Call object
      const call = await device.connect({ params });

      // add listeners to the Call
      // "accepted" means the call has finished connecting and the state is now "open"
      call.on("accept", updateUIAcceptedOutgoingCall);
      call.on("disconnect", updateUIDisconnectedOutgoingCall);
      call.on("cancel", updateUIDisconnectedOutgoingCall);

      outgoingCallHangupButton.onclick = () => {
        log("Hanging up ...");
        call.disconnect();
      };
    } else {
      log("Unable to make call.");
    }
  }

  function updateUIAcceptedOutgoingCall(call) {
    log("Call in progress ...");
    customerIdLabel.textContent = localStorage.getItem("id");
    callStartTime = new Date();
    timerInterval = setInterval(updateCallTimer, 1000);
    outgoingCallHangupButton.classList.remove("hide");
    numpad.classList.remove("hide");
    buttoncallcontainner.classList.add("hide");
  }
  async function startcall(e) {
    e.preventDefault();
    makeOutgoingCall();
    errorMessage.classList.add("hide");
  }
  function updateUIDisconnectedOutgoingCall() {
    log("Call disconnected.");
    document.getElementById("call-timer").textContent = "Starting call...";
    callStartTime = null; // Reset the call timer
    clearInterval(timerInterval); // Stop the timer interval
    closeButton.click();
    outgoingCallHangupButton.classList.add("hide");
    numpad.classList.add("hide");
    buttoncallcontainner.classList.remove("hide");

    // Reset the timer display
  }

  // HANDLE INCOMING CALL

  function handleIncomingCall(call) {
    log(`Incoming call from ${call.parameters.From}`);

    //show incoming call div and incoming phone number
    incomingCallDiv.classList.remove("hide");

    //add event listeners for Accept, Reject, and Hangup buttons
    incomingCallAcceptButton.onclick = () => {
      acceptIncomingCall(call);
    };

    incomingCallRejectButton.onclick = () => {
      rejectIncomingCall(call);
    };

    incomingCallHangupButton.onclick = () => {
      hangupIncomingCall(call);
      pop;
    };

    // add event listener to call object
    call.on("cancel", handleDisconnectedIncomingCall);
    call.on("disconnect", handleDisconnectedIncomingCall);
    call.on("reject", handleDisconnectedIncomingCall);
  }

  // Activity log
  function log(message) {
    console.log(message);
  }

  // AUDIO CONTROLS

  async function getAudioDevices() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    updateAllAudioDevices.bind(device);
  }

  function updateAllAudioDevices() {
    if (device) {
      updateDevices(speakerDevices, device.audio.speakerDevices.get());
      updateDevices(ringtoneDevices, device.audio.ringtoneDevices.get());
    }
  }

  function updateOutputDevice() {
    const selectedDevices = Array.from(speakerDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.speakerDevices.set(selectedDevices);
  }

  function updateRingtoneDevice() {
    const selectedDevices = Array.from(ringtoneDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.ringtoneDevices.set(selectedDevices);
  }

  // Update the available ringtone and speaker devices
  function updateDevices(selectEl, selectedDevices) {
    selectEl.innerHTML = "";

    device.audio.availableOutputDevices.forEach(function (device, id) {
      var isActive = selectedDevices.size === 0 && id === "default";
      selectedDevices.forEach(function (device) {
        if (device.deviceId === id) {
          isActive = true;
        }
      });

      var option = document.createElement("option");
      option.label = device.label;
      option.setAttribute("data-id", id);
      if (isActive) {
        option.setAttribute("selected", "selected");
      }
      selectEl.appendChild(option);
    });
  }

  function closePopup() {
    const popup = document.getElementById("error-popup");
    popup.style.display = "none";
  }

  function handleIncomingCall(call) {
    log(`Incoming call from ${call.parameters.From}`);

    //show incoming call div and incoming phone number
    incomingCallDiv.classList.remove("hide");
    // incomingPhoneNumberEl.innerHTML = call.parameters.From;

    //add event listeners for Accept, Reject, and Hangup buttons
    incomingCallAcceptButton.onclick = () => {
      acceptIncomingCall(call);
    };

    incomingCallRejectButton.onclick = () => {
      rejectIncomingCall(call);
    };

    incomingCallHangupButton.onclick = () => {
      hangupIncomingCall(call);
    };

    // add event listener to call object
    call.on("cancel", handleDisconnectedIncomingCall);
    call.on("disconnect", handleDisconnectedIncomingCall);
    call.on("reject", handleDisconnectedIncomingCall);
  }

  // ACCEPT INCOMING CALL

  function acceptIncomingCall(call) {
    call.accept();

    //update UI
    log("Accepted incoming call.");
    buttonincomingcallcontainner.classList.add("hide");
    incomingCallAcceptControler.classList.remove("hide");
    incomingCallHangupButton.classList.remove("hide");
    callStartTime = new Date();
    timerInterval = setInterval(updateCallTimerIncomingCall, 1000);
  }

  // REJECT INCOMING CALL

  function rejectIncomingCall(call) {
    call.reject();
    log("Rejected incoming call");
    resetIncomingCallUI();
  }

  // HANG UP INCOMING CALL

  function hangupIncomingCall(call) {
    call.disconnect();
    log("Hanging up incoming call");
    resetIncomingCallUI();
  }

  // HANDLE CANCELLED INCOMING CALL

  function handleDisconnectedIncomingCall() {
    log("Incoming call ended.");
    resetIncomingCallUI();
  }
  function resetIncomingCallUI() {
    buttonincomingcallcontainner.classList.remove("hide");
    incomingCallAcceptControler.classList.add("hide");
    incomingCallHangupButton.classList.add("hide");
    incomingCallDiv.classList.add("hide");
  }
});
