import api from "../services/api";

export const loginUser = async (email, password, remember = false) => {
  try {
    const response = await api.post("/auth/admin/login", {
      email,
      password,
    });

    const storage = remember ? localStorage : sessionStorage;
    const payload = {
      token: response.data.token,
      user: response.data.user,
    };

    storage.setItem("gs_user", JSON.stringify(payload));
    storage.setItem("token", response.data.token);
    storage.setItem("user", JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 404)) {
      try {
        const response = await api.post("/auth/user/login", {
          email,
          password,
        });

        sessionStorage.setItem(
          "gs_user",
          JSON.stringify({
            token: response.data.token,
            user: response.data.user,
          })
        );

        return response.data;
      } catch (userError) {
        console.error(userError);
        throw userError;
      }
    }

    console.error(error);
    throw error;
  }
};