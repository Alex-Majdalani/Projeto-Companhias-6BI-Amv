import axios from 'axios';
import 'dotenv/config';

async function fetchColumns() {
  try {
    const tableId = 'mgjtgm3f60as8gd';
    const usrRes = await axios.get(`${process.env.NOCODB_URL}/api/v2/meta/tables/${tableId}`, {
      headers: { 'xc-token': process.env.NOCODB_TOKEN }
    });
    const columns = usrRes.data.columns;
    const info = columns.map((col: any) => ({
      id: col.id,
      title: col.title,
      column_name: col.column_name,
      uidt: col.uidt,
      colOptions: col.colOptions
    }));
    console.log("RefreshToken Table Columns:", JSON.stringify(info, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.response ? error.response.data : error.message);
    } else {
      console.error("Error:", error instanceof Error ? error.message : error);
    }
  }
}
fetchColumns();
