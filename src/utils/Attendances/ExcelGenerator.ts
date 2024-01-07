import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { format } from 'ssf';


interface IRecordFilter{
    id: string;
    name: string;
    isRequired: boolean;
    type: string;
    options?: any[];
    value?: any;
}

interface IRecordData{
    headers: any[];
    body: any[];
}



class ExcelGenerator{
    public static generateExcelFrom(options: {filters: IRecordFilter[], data: IRecordData, title: string}){
        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet 1");
        const maxColumns = options.data.headers.length;
        const getExcelAlpha = (index: number) => {
            //Get excel column name from index, if overflow Z, then AA, AB, AC, etc.:
            let excelAlpha = "";
            let overflow = false;
            let overflowIndex = 0;
            while (index > 26){
                overflow = true;
                overflowIndex++;
                index = index - 26;
            }
            if (overflow){
                excelAlpha += String.fromCharCode(64 + overflowIndex);
            }
            excelAlpha += String.fromCharCode(64 + index);
            return excelAlpha;
        }

        //Add master header rows:
        worksheet.addRows([["MARANATHA"]]);
        worksheet.mergeCells('A1:'+getExcelAlpha(maxColumns)+'1');
        worksheet.getCell('A1').font = { size: 20, bold: true };
        worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};

        worksheet.addRows([[options.title]]);
        worksheet.mergeCells('A2:'+getExcelAlpha(maxColumns)+'2');
        worksheet.getCell('A2').font = { size: 14, bold: true };
        worksheet.getCell('A2').alignment = {vertical: 'middle', horizontal: 'center'};

        worksheet.addRows([["Country - Peru"]]);
        worksheet.mergeCells('A3:'+getExcelAlpha(maxColumns)+'3');
        worksheet.getCell('A3').font = { size: 12, bold: true };
        worksheet.getCell('A3').alignment = {vertical: 'middle', horizontal: 'center'};

        const countMasterHeaderRows = 3

        //Add filter rows:
        let validFilters = 0;
        options.filters.forEach((filter) => {
            if (filter.value != null){
                const itemIndex = (countMasterHeaderRows + 1) + validFilters;

                let value = filter.value;
                if (DateTime.fromISO(filter.value).isValid){
                    value = DateTime.fromISO(filter.value).toFormat("dd/MM/yyyy");
                }

                worksheet.addRows([[filter.name + ": " + value]]);
                worksheet.mergeCells('A'+(itemIndex)+':'+getExcelAlpha(maxColumns)+(itemIndex));
                worksheet.getCell('A'+(itemIndex)).alignment = {vertical: 'middle', horizontal: 'center'};
                validFilters++;
            }
        })

        //Add header rows:
        worksheet.addRows([options.data.headers.map((header) => header.title)]);
        worksheet.getRow(countMasterHeaderRows + validFilters + 1).eachCell((cell) => {
            cell.border = {
                top: {style:'thin'},
                left: {style:'thin'},
                bottom: {style:'thin'},
                right: {style:'thin'}
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: '00EBEBEB'
                }
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            cell.font = { bold: true };
        });


        //Add body rows:
        options.data.body.forEach((row) => {
            const orderObjectKeys = (obj:any, keyOrder:any) => {
                const ordered:any = {};
                keyOrder.forEach((key:any) => {
                    if (obj.hasOwnProperty(key)) {
                        ordered[key] = obj[key]; 
                    }
                });
                return ordered;
            }
            const getObjectValues = (obj:any) => {
                return Object.keys(obj).map(key => obj[key]);
            }
            const items = getObjectValues(orderObjectKeys(row, options.data.headers.map((header) => header.key)));

            worksheet.addRows([items]);
            worksheet.getRow(worksheet.rowCount).eachCell((cell) => {
                cell.border = {
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                };
                cell.numFmt = 'General';
            });
        });


        const autoFitColumn = (column: ExcelJS.Column) => {
            const numFmt = column.numFmt;
            let maxLength = 6;
            column.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
                let columnLength: number;
                if (numFmt && cell.value != undefined) {
                    switch (cell.type) {
                        case ExcelJS.ValueType.Number:
                            const formattedNumber = format(numFmt, cell.value as Number);
                            columnLength = formattedNumber.length;
                            break;
                        default:
                            const formatted = format(numFmt, cell.value);
                            columnLength = formatted.length;
                            break;
                    }
                } else {
                    columnLength = cell.text.length;
                }
                maxLength = Math.max(maxLength, columnLength);
                });
            column.width = maxLength + 2;
        };

        //Adjust columns width to auto from A to maxColumns:
        for (let i = 1; i <= maxColumns; i++) {
            worksheet.getColumn(i).width = 15
        }


        // Export to file
        return new Promise((resolve, reject) => {
            workbook.xlsx.writeBuffer().then(data => {
                const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                //Convert to base64 content:
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    resolve(reader.result?.split(',')[1]);
                };
            });
        })
        
    }
}


export {ExcelGenerator}