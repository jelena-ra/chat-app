import IP_ADDRESS from '@/assets/config';
import * as SecureStore from 'expo-secure-store';
 
export const fetchWithAuth = async (url, options = {},token) => {

  const storedtoken = await SecureStore.getItemAsync('accessToken');

  let headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (storedtoken) {
    headers['Authorization'] = `Bearer ${storedtoken}`;
  }

 
  let response = await fetch(url, { ...options, headers });


  if (response.status === 401 || response.status === 403) {
    console.log("Token expired, trying refresh...");

    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error("Nema refresh tokena");
      console.log("REfresh token: ",refreshToken);

      const refreshResponse = await fetch(`http://${IP_ADDRESS}:8080/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken })
      });

      if (!refreshResponse.ok) {
        throw new Error("Refresh token invalid");
      }

  
      const data = await refreshResponse.json();
      const newAccessToken = data.accessToken;  
      const newRefreshToken = data.refreshToken; 

      await SecureStore.deleteItemAsync('accessToken' );
      await SecureStore.deleteItemAsync('refreshToken');

      await SecureStore.setItemAsync('accessToken', newAccessToken);
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);

   
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, { ...options, headers });

    } catch (error) {
      console.log("Both tokens expired, erorcina", error);
    
     
      throw error; 
    }
  }


  return response;
};