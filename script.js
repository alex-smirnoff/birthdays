document.getElementById("fileInput").addEventListener("change", async function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const filespan = document.getElementById('filespan');
    const fileButton = document.getElementById('fileButton');
    const loader = document.getElementById('loader');
    const loaderspan = document.getElementById('loaderspan');
    const comments = document.getElementById('comments');
    const reloadButton = document.getElementById('reloadButton');

    filespan.innerText = file.name;
    fileButton.setAttribute("disabled", "true");

    loader.style.display = "block";
    loaderspan.style.display = "block";

    if (!file) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(e) {
        document.getElementById('startDate').removeAttribute("disabled");
        var data = e.target.result;
        var workbook = XLSX.read(data, {type: 'binary'});
        var sheetName = workbook.SheetNames[0];
        var sheet = workbook.Sheets[sheetName];
        var html = XLSX.utils.sheet_to_html(sheet);
        comments.innerHTML = html;

        filterRows();

        loader.style.display = "none";
        loaderspan.style.display = "none";
        reloadButton.style.display = "block";
    };
    reader.readAsBinaryString(file);
});

async function filterRows() {
    const table = document.querySelector('.comments table');
    const rows = table.querySelectorAll('tr');
    const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;

    const cellsToRemove = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let dateFound = false;
        cells.forEach(cell => {
            if (datePattern.test(cell.textContent)) {
                dateFound = true;
            }
            if (cell.innerText.length < 1) {
                cellsToRemove.push(cell);
            }
        });
        if (!dateFound) {
            row.remove();
        }
    });
    cellsToRemove.forEach(cell => cell.remove());
}

document.getElementById('startDate').addEventListener("change", function(e){
    this.setAttribute("disabled", true);
    document.getElementById('endDate').removeAttribute("disabled");
    const startDatePicker = document.getElementById('startDate');
    const startDate = parseDate(startDatePicker.value);

    const table = document.querySelector('.comments table');
    const rows = table.querySelectorAll('tr');
    const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let dateFound = false;
        cells.forEach(cell => {
            if (datePattern.test(cell.textContent)) {
                dateFound = true;
                const compareDate = parseDate2(cell.textContent);
                if (compareDate < startDate) {
                    row.remove();
                }
            }
        });
    });
    sortTableByDate()
});
document.getElementById('endDate').addEventListener("change", function(e){
    this.setAttribute("disabled", true);
    const endDatePicker = document.getElementById('endDate');
    const endDate = parseDate(endDatePicker.value);

    const table = document.querySelector('.comments table');
    const rows = table.querySelectorAll('tr');
    const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let dateFound = false;
        cells.forEach(cell => {
            if (datePattern.test(cell.textContent)) {
                dateFound = true;
                const compareDate = parseDate2(cell.textContent);
                if (compareDate > endDate) {
                    row.remove();
                }
            }
        });
    });
    groupAndLogByDate();
});

function parseDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return new Date(2000, month - 1, day);
}
function parseDate2(dateString) {
    const [day, month, year] = dateString.split('.');
    return new Date(2000, month - 1, day);
}


function sortTableByDate() {
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tr'));
    
    rows.sort((rowA, rowB) => {
        const dateA = findAndParseDate(rowA);
        const dateB = findAndParseDate(rowB);
        return dateA - dateB;
    });
    
    rows.forEach(row => table.appendChild(row));
}

function findAndParseDate(row) {
    for (let cell of row.cells) {
        const dateMatch = cell.textContent.match(/(\d{2})\.(\d{2})\.\d{4}/);
        if (dateMatch) {
            const [_, day, month] = dateMatch;
            return new Date(2000, month - 1, day);
        }
    }
    return new Date(0);
}

function groupAndLogByDate() {
    const rows = document.querySelectorAll('table tr');
    const dateNamesArr = [];

    rows.forEach(row => {
        const firstTd = row.querySelector('td:last-child').innerText.trim().substring(0, 5);
        const secondTd = row.querySelector('td:nth-child(2)').innerText.trim();
        const fifthTd = `${row.querySelector('td:nth-child(5)').innerHTML.trim()} ${row.querySelector('td:nth-child(6)').innerHTML.trim()}`;

        const dateName = {
            date: firstTd,
            name: secondTd,
            city: determineCity(fifthTd)
        };
        dateNamesArr.push(dateName);
    });
    result = Object.groupBy(dateNamesArr, ({ date }) => date);
    const dates = Object.keys(result);
    const firstDate = dates.length > 0 ? dates[0] : undefined;
    const lastDate = dates.length > 0 ? dates[dates.length - 1] : undefined;
    let output = '';
    for (const [date, names] of Object.entries(result)) {
        output += `🎉 <b>${date}</b><br>`;
        names.forEach(item => {
            output += `${item.name}, ${item.city}<br><br>`;
        });
    }
    comments.innerHTML = output;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1080;
    tempCanvas.height = 1080;
    const ctx = tempCanvas.getContext("2d");
    const img = new Image();
    img.src = "birthdayImg.png";
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 1080, 1080);
        ctx.font = "29pt Montserrat";
        ctx.fillStyle = "white";
        ctx.fillText(`${firstDate} – ${lastDate}`, 112, 575);
        const downloadLink = document.createElement("a");
        downloadLink.href = tempCanvas.toDataURL("image/png");
        downloadLink.download = "birthdayImage.png";
        downloadLink.click();
    }
}

function determineCity(cityString) {
    const cities = [
        "Дніпро", "Одеса", "Миколаїв", "Кременчук", "Вінниця", "Бровари", 
        "Кривий Ріг", "Харків", "Святопетрівське", "Львів", "Тернопіль", 
        "Хмельницький", "Брошнів-Осада", "Київ"
    ];
    
    for (let city of cities) {
        if (cityString.includes(city)) {
            return city;
        }
    }
    
    return "Київ";
}