import api from "../config/axiosClient";

export const uploadService = {
  uploadFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
};
