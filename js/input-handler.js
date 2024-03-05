function handleInputPrompt(elem) {
      const thisInput = document.getElementById(elem.id);

      if (elem.value.length > 0) {
        thisInput.classList.add("input-hidden");
      } else {
        thisInput.classList.remove("input-hidden");
      }
}

function expandCardInput() {
    document.getElementById("expand-card-input").hidden = true;
    document.getElementById("card-input-prompt").hidden = false;
}

function isNumericKey(event, isCommaSeparator=false) {
    var code = (event.which) ? event.which : event.keyCode;
    return (isCommaSeparator && event.key == '.') || !((code < 48 || code > 57) && (code > 31));
}


