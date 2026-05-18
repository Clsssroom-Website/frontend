import api from "./api/axiosClient";

export const uploadService = {
  uploadFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post("/api/v1/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
};
