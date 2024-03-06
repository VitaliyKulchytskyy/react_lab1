import fundInfo from "./tmp/fund_info.json" assert {type: 'json'};

const event = new Event("sessionPayment");
window.minChip = 10;
window.maxChip = 29_999;

document.addEventListener('DOMContentLoaded', function() {
    try {
        updateFundInfo(fundInfo);
        handlerPaymentButtons(fundInfo);
        handlerConfirmFormButton();
        handlerStaticChipButtons();

        document.addEventListener("sessionPayment", function() {
            const curChip = document.getElementById("custom-chip");
            var customChip = formatMoneyToFloat(curChip.innerText) + event.chip;
            curChip.innerHTML = chipHandler(customChip);
        });

        document.getElementById("payment-cc-number").oninput = function() {
            this.value = parseCardNumber(this.value);
        };

        document.getElementById("payment-cc-month").oninput = function() {
            const month = document.getElementById("payment-cc-month-error");
            if (isCorrectMonth(this.value)) {
                month.setAttribute("hidden", true);
            } else {
                month.removeAttribute("hidden");
            }
        }

        document.getElementById("payment-cc-year").oninput = function() {
            const year = document.getElementById("payment-cc-year-error");
            if (this.value > 0) {
                year.setAttribute("hidden", true);
            } else {
                year.removeAttribute("hidden");
            }
        }

        var moneyInput = document.getElementById("custom-chip")
        moneyInput.addEventListener("input", function(event){
            parseCustomChip(event, moneyInput);
        });
    } catch (e) {
        console.log(e);
    }
});

function handlerStaticChipButtons() {
    const chips = [100, 500, 1000];
    for (let i = 0; i < chips.length; i++) {
        let deepChip = chips[i];
        document.getElementById("chip-" + chips[i]).onclick = function() {
            event.chip = deepChip;
            document.dispatchEvent(event);
        };
    }
}

function handlerConfirmFormButton() {
    const fields = ["payment-cc-number", "payment-cc-month", "payment-cc-year", "payment-cc-cv2"];
    for (let i = 0; i < fields.length; i++) {
        document.getElementById(fields[i]).addEventListener("input", updateSendMoneyBtn);
    }
}

function updateSendMoneyBtn() {
    var isFilledCard = document.getElementById("payment-cc-number").value.length == 19;
    var isFilledMonth = isCorrectMonth(document.getElementById("payment-cc-month").value);
    var isFilledYear = document.getElementById("payment-cc-year").value > 0;
    var isFilledCv2 = document.getElementById("payment-cc-cv2").value.length == 3;
    var btn = document.getElementById("payment-cc-button");

    if (isFilledCard && isFilledMonth && isFilledYear && isFilledCv2) {
        btn.classList.remove("disable");
    } else {
        btn.classList.add("disable");
    }
}

function isCorrectMonth(value) {
    return value >= 1 && value <= 12;
}

function parseCustomChip(event, input) {
    var selectionStart = window.getSelection().getRangeAt(0).startOffset;
    var selectionEnd = window.getSelection().getRangeAt(0).endOffset;

    var innerContent = event.target.innerText;
    var filtered = innerContent.replace(/[^0-9.]/g, "");

    if (filtered.charAt(0) == 0 && filtered.length > 1)
        filtered = filtered.slice(1);

    var parts = filtered.split('.');
    if (parts.length > 1) {
        if (parts[1].length == 0)
            parts[1] = '1';
        parts[1] = parts[1].slice(0, 2);
        filtered = parts.join('.');
    }

    if (filtered == "")
        filtered = 0;

    input.innerText = chipHandler(filtered);

    var newRange = document.createRange();
    var selection = window.getSelection();
    newRange.setStart(event.target.childNodes[0], input.innerText.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

function chipHandler(chip) {
    if (chip > window.maxChip)
        chip = window.maxChip;

    customChipHandler(chip);
    return formatMoney(chip);
}

function parseCardNumber(value) {
    var v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    var matches = v.match(/\d{4,16}/g);
    var match = matches && matches[0] || '';
    var parts = [];

    for (var i = 0, len = match.length; i < len; i += 4)
        parts.push(match.substring(i, i + 4));

    return parts.length ? parts.join(' ') : value;
}

function formatMoneyToFloat(amount, thousands=' ') {
    return parseFloat(amount.replace(thousands, ''));
}

function formatMoney(amount, decimalCount=2, decimal='.', thousands=' ') {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? '-' : '';

    var i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    var j = (i.length > 3) ? i.length % 3 : 0;
    var fraction = (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands);
    if (amount - i <= 0.01)
        return negativeSign + fraction;

    return negativeSign +
        fraction +
        (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
};

function listToMoney(values, decimalCount=2) {
    values.forEach(function(part, index) {
        this[index] = formatMoney(this[index], decimalCount=decimalCount);
    }, values);
    return values;
}

function customChipHandler(chip) {
    var moneyInputBlock = document.querySelector(".money-input-block");
    var moneyInputSubtitle = document.querySelector(".money-input-subtitle");

    if (chip == null) {
        moneyInputBlock.classList.remove("incorrect");
        moneyInputBlock.classList.add("empty");
        moneyInputSubtitle.setAttribute("hidden", true);
        return;
    }

    if (chip < window.minChip || chip > window.maxChip) {
        moneyInputBlock.classList.add("incorrect");
        moneyInputBlock.classList.remove("empty");
        moneyInputSubtitle.removeAttribute("hidden");
    } else {
        moneyInputBlock.classList.remove("incorrect");
        moneyInputBlock.classList.remove("empty");
        moneyInputSubtitle.setAttribute("hidden", true);
    }
}

function getPaymentInfo(bank) {
    if (bank == "Custom Card")
        return getPaymentCustomCardInfo();

    const curChip = document.getElementById("custom-chip");
    const chip = formatMoneyToFloat(curChip.innerText);

    return {
        "chip": chip,
        "bank": bank,
        "cardOwner": document.getElementById("payment-cc-name").value,
        "paymentComment": document.getElementById("payment-comment").value,
    };
}

function getPaymentCustomCardInfo() {
    const curChip = document.getElementById("custom-chip");
    const chip = formatMoneyToFloat(curChip.innerText);

    return {
        "chip": chip,
        "cardOwner": document.getElementById("payment-cc-name").value,
        "paymentComment": document.getElementById("payment-comment").value,
        "cardNumber": document.getElementById("payment-cc-number").value,
        "cardMonth": document.getElementById("payment-cc-month").value,
        "cardYear": document.getElementById("payment-cc-year").value,
        "cardCvc2": document.getElementById("payment-cc-cv2").value,
    };
}

function getAccumulatedMoney() {
    return parseFloat(localStorage.getItem("accumulatedMoney") || 0);
}

function setAccumulatedMoney(newValue) {
    localStorage.setItem("accumulatedMoney", parseFloat(newValue));
}

function addAccumulatedMoney(addValue) {
    setAccumulatedMoney(getAccumulatedMoney() + parseFloat(addValue));
    return getAccumulatedMoney();
}

function updateAccumulatedMoney(fundInfo) {
    var money = getAccumulatedMoney();
    document.getElementById("current-sum").textContent = formatMoney(money);
    document.getElementById("jar-state").setAttribute("src", getJarStateSrcByCurrentValue(money, fundInfo["targetSum"]));
}

function resotoreInputField(fieldName) {
    const field = document.getElementById(fieldName);
    field.value = "";
    field.classList.remove("input-hidden");
}

function emptyForm() {
    const fields = ["payment-cc-name", "payment-comment", "payment-cc-number", "payment-cc-month", "payment-cc-year", "payment-cc-cv2"];

    document.getElementById("custom-chip").innerText = 0;
    customChipHandler(null);

    for(let i = 0; i < fields.length; i++)
        resotoreInputField(fields[i]);
}


function handlerPaymentButtons(fundInfo) {
    const bankButtons = {
        "btn_monopay": "mono bank",
        "btn_gpay": "Google Pay",
        "payment-cc-button": "Custom Card"
    };

    for (const [btnId, bankName] of Object.entries(bankButtons)) {
        const elem = document.getElementById(btnId);
        elem.addEventListener("click", function () {
            if (elem.classList.contains('disable')) {
                console.log("here");
                return;
            }

            var paymentInfo = getPaymentInfo(bankName);
            if (paymentInfo["chip"] < window.minChip) {
                customChipHandler(0);
            } else {
                alert(JSON.stringify(paymentInfo));
                emptyForm();
                addAccumulatedMoney(paymentInfo["chip"]);
                updateAccumulatedMoney(fundInfo);
            }
        });
    }
}

function displayTargetFundSum() {
    return `
    <div class="stats-data" id="target-block" style="border-left: solid #ccc 0.5px;">
        <img src="img/stats/target.svg" alt="collected" class="icon">
            <div class="stats-data-text-container">
                <div class="stats-data-label">
                    Ціль
                </div>
            <div class="stats-data-value">
                <span id="target-sum">0</span> <span>₴</span>
            </div>
        </div>
    </div>`;
}

function getJarStateSrcByCurrentValue(currentValue, maxValue) {
    if (maxValue == null)
        return "img/jar/uah_50.png";

    const jarStates = {
        "img/jar/uah_0.png":    0.33,
        "img/jar/uah_33.png":   0.5,
        "img/jar/uah_50.png":   1,
        "img/jar/uah_100.png":  Infinity
    };

    for (const [src, value] of Object.entries(jarStates)) {
        if (currentValue < value * maxValue)
            return src;
    }

    return "img/jar/uah_0.png";
}

function updateJarGrid(maxValue) {
    const gridId = ["grid-bottom-sum", "grid-mid-sum", "grid-upper-sum"];
    var temp = calcGridDestribution(maxValue, gridId.length);
    const gridDestrib = listToMoney(temp);

    for (var i = 0; i < gridId.length; i++)
        document.getElementById(gridId[i]).textContent = gridDestrib[i];
}

function calcGridDestribution(maxValue, gridScaleCount) {
    var out = [];
    out[0] = 0;
    out[gridScaleCount - 1] = maxValue;

    if (gridScaleCount <= 2)
        return out;

    const step = maxValue/(gridScaleCount - 1);
    for (var i = 1; i < gridScaleCount - 1; i++)
        out[i] = out[i - 1] + step;

    return out;
}

function updateFundInfo(fundInfo) {
    document.getElementById("fund-owner").innerText = fundInfo["ownerName"] + " збирає";
    document.getElementById("fund-name").innerText = fundInfo["fundName"];
    document.getElementById("fund-description").innerText = fundInfo["fundDescription"];
    updateAccumulatedMoney(fundInfo);
    const targetSum = fundInfo["targetSum"];

    if (targetSum === null) {
        document.getElementById("jar-grid").setAttribute("hidden", true);
        document.querySelectorAll("grid").forEach(function(element) {
            element.setAttribute("hidden", true);
        });
    } else {
        document.getElementById("jar-info").innerHTML += displayTargetFundSum();
        updateJarGrid(targetSum);
        document.getElementById("target-sum").innerText = formatMoney(targetSum);
    }
}
