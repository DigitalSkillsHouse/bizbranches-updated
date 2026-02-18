import { NextRequest } from "next/server"

const provinces = [
  { id: "Punjab", name: "Punjab" },
  { id: "Sindh", name: "Sindh" },
  { id: "KPK", name: "Khyber Pakhtunkhwa" },
  { id: "Balochistan", name: "Balochistan" },
  { id: "GB", name: "Gilgit-Baltistan" },
  { id: "ICT", name: "Islamabad Capital Territory" },
  { id: "AJK", name: "Azad Jammu & Kashmir" }
]

export async function GET(_req: NextRequest) {
  return Response.json(provinces)
}