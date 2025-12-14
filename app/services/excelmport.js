import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

export const readExcelFromPath = async filePath => {
    try {
        const fileData = await RNFS.readFile(filePath, 'base64');
        const workbook = XLSX.read(fileData, { type: 'base64' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet);

        return jsonData;
    } catch (err) {
        console.log('Excel read error:', err);
        throw err;
    }
};
