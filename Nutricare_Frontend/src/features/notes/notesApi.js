import { http } from "../../shared/api/http";

export async function listMyDoctorNotes() {
  const res = await http.get("/users/notes");
  return res.data;
}

