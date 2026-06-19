const axios = require('axios');
const url = process.env.NOCODB_API_URL || 'https://nocodb.alexdatawise.cloud';
const token = process.env.NOCODB_API_TOKEN || 'nc_pat_GdZStg4K7cJMNMf32gyh3FArJc3kkwGeVie1v1Hi';

axios.get(`${url}/api/v2/meta/bases`, {
  headers: { 'xc-token': token }
}).then(res => {
  const baseId = res.data.list[0].id;
  return axios.get(`${url}/api/v2/meta/bases/${baseId}/tables`, {
    headers: { 'xc-token': token }
  });
}).then(res => {
  res.data.list.forEach(t => console.log(`${t.title}: ${t.id}`));
}).catch(console.error);
