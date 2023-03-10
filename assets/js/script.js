let _data = null;
        let _fileNameOutput = "output";

        function dragOverHandler(ev) {
            // console.log('File(s) in drop zone');
            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();
        }
        function dropHandler(ev) {
            console.log('File(s) dropped');
            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();
            if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                [...ev.dataTransfer.items].forEach((item, i) => {
                // If dropped items aren't files, reject them
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    console.log(`… file[${i}].name = ${file.name}`);
                    _fileNameOutput = file.name.split('.')[0] + '-decimal';
                    processFile(file);
                }
                });
            } else {
                // Use DataTransfer interface to access the file(s)
                [...ev.dataTransfer.files].forEach((file, i) => {
                    console.log(`… file[${i}].name = ${file.name}`);                
                    processFile(file); 
                });
            }
        }

        function upload() {
            var files = document.getElementById('file_upload').files;
            if(files.length==0){
                // alert("Please choose any file...");
                return;
            }
            processFile(files[0])
        }



        function processFile(file) {
            var filename = file.name;
            var extension = filename.substring(filename.lastIndexOf(".")).toUpperCase();
            if (extension == '.XLS' || extension == '.XLSX') {
                processEexcelFile(file);
            }else{
                alert("Please select a valid excel file.");
            }
            const myElement = document.getElementById("filesListElement");
            if(myElement) {
                myElement.innerHTML = file.name;
            }
            // let reader = new FileReader();
            // reader.readAsText(file);
            // reader.onload = function() {
            //     console.log(reader.result);
            // };

            // reader.onerror = function() {
            //     console.log(reader.error);
            // };
        }

        function processEexcelFile(file){
            let text = "";
            try {
                const reader = new FileReader();
                reader.readAsBinaryString(file);
                reader.onload = function(e) {
                const data = e.target.result;
                const workbook = XLSX.read(data, {
                    type : 'binary',
                    
                });
                let result = {};
                // console.log(workbook.Sheets.Sheet2)
                let jsonObj = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet2'], {raw: false});
                _data = {};
                processDatesJson(jsonObj, _data);
                console.log(_data.results);
                _data.total = summarize(_data);
                if(_data.errors && _data.errors.length > 0) {
                    console.error('Errors: ', _data.errors);
                } else {
                    console.log('No errors')
                }
                console.log('Max: ', _data.max);
                console.log('Min: ', _data.min);
                console.log('# working days: ', _data.workDays);
                console.log('Total hours: ', _data.total);
                // workbook.SheetNames.forEach(function(sheetName) {
                    // var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    // if (roa.length > 0) {
                    //     result[sheetName] = roa;
                    // }
                // });
                // text = JSON.stringify(result, null, 4);
                // processDates(result.Sheet2)
                
                // console.log(result.Sheet2)
                }
            }catch(e){
                console.error(e);
            }
        }

        function processDatesJson(datesJsonArray, outputData) {
            const results = [];
            let daysOfWork = 0;
            let sickDays = 0;
            let daysOff = 0;
            datesJsonArray.forEach(date => {
                // console.log(date);
                x = Object.keys(date).map(key => date[key])
                // console.log(x)
                if(x[7] === "עבודה") {
                    const prod = procossDateLine(x[0],x[4],x[5], x[3]);
                    results.push(prod)
                    daysOfWork++;
                } else if(x[4] === "עבודה") {
                    const prod = procossDateLine(x[0],x[1],x[2], x[4]);
                    results.push(prod);
                    daysOfWork++;
                } else if(x[5] === "עבודה") {
                    const prod = procossDateLine(x[0],x[2],x[3], x[4]);
                    results.push(prod);
                    daysOfWork++;
                }

            });
            outputData.results = results;
            outputData.workDays = daysOfWork;
        }

        function procossDateLine(date, start, end, total) {
            startTime = parseTime(start);
            endTime = parseTime(end);
            return {
                date: date,
                start: startTime,
                end: endTime,
                diff: endTime - startTime
            }
            // console.log(date, endTime - startTime, total);
        }

        function summarize(data) {
            const resultsArray = data.results;
            let total = 0;
            const errors = [];
            let min = 99;
            let max = 0;
            resultsArray.forEach(element => {
                if(element.diff<0) {
                    errors.push({'date': element.date, 'err': 'negative hours'})
                }
                min = min < element.diff ? min: element.diff;
                max = max > element.diff ? max: element.diff;
                total += element.diff;
            });
            data.errors = errors;
            data.max = max;
            data.min = min;
            return total;
        }

        function parseTime(timeString) {
            const time = timeString.split(':');
            const hour = +time[0];
            const min = +time[1] / 60;
            return hour + min;

        }

        function processDates(dates) {
            const DatesDic = {};
            dates.forEach(date => {
                console.log(date);      
            });
        }

        function saveAsExcel() {
            if(_data === null) {
                return;
            }

            const data = _data.results.map(e => {
                return [e.date, 
                        Math.round(e.start*100)/100, 
                        Math.round(e.end*100)/100, 
                        Math.round(e.diff*100)/100];
            });

            data.push(['Total work lines' ,_data.workDays]);
            data.push(['Total work time (decimal)' ,Math.round(_data.total*100)/100]);
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            workbook.SheetNames.push("First");
            workbook.Sheets["First"] = worksheet;
            XLSX.writeFile(workbook, _fileNameOutput + ".xlsx");
        }