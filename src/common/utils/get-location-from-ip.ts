import axios from 'axios';

const getLocationFromIp = async (ip: string) => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);

    return {
      country: response?.data?.country || 'Unknown',
      city: response?.data?.city || 'Unknown',
      lat: response?.data?.latitude || 0,
      lon: response?.data?.longitude || 0,
    };
  } catch (e: any) {
    console.error('Error fetching location from IP:', e.response?.data?.error);
    return { country: 'Unknown', city: 'Unknown', lat: 0, lon: 0 };
  }
};

export default getLocationFromIp;
