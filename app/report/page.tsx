"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import the Google Generative AI library
import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";
import { Libraries } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  createReport,
  getRecentReports,
  getUserByEmail,
  getWeather,
} from "@/utils/db/actions";
import { create } from "domain";

const geminiApiKey = process.env.GEMINI_API_KEY as any;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY as any;

const libraries: Libraries = ["places"];

export default function ReportPage() {
  const [user, setUser] = useState("") as any;
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{
      id: number;
      location: string;
      materialType: string;
      temperature: number;
      status: string;
      created_at: string;
    }>
  >([]);

  const [newReport, setNewReport] = useState({
    location: "",
    materialType: "",
    temperature: 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");

  const [verificationResult, setVerificationResult] = useState<{
    temperatureType: number;
    quantity: string;
    confidence: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  });

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        setNewReport((prev) => ({
          ...prev,
          location: place.formatted_address || "",
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng(),
        }));
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewReport({ ...newReport, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file || !newReport.location) return;

    setVerificationStatus("verifying");

    try {
      const weatherTemperature = await getWeather(newReport.location);
      if (weatherTemperature === null) {
        throw new Error("Invalid location");
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const base64 = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64.split(",")[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are an expert in temperature management and verification.
      Analyze the temperature of the material and provide a detailed report.
      1. The type of material (e.g., plastic, metal, paper, organic, wood, glass, etc.).
      2. Depending on the weather (current temperature: ${weatherTemperature}°C) that day, what is the expected temperature of the material?
      3. Your confidence level in the temperature analysis.
  
      Respond in JSON format like this:
      {
        "temperatureType": "type of material",
        "quantity": "expected temperature",
        "confidence": "confidence level as a number between 0 and 1"
      }
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      try {
        const parsedResult = JSON.parse(text);
        if (
          parsedResult.temperatureType &&
          parsedResult.quantity &&
          parsedResult.confidence
        ) {
          setVerificationResult(parsedResult);
          setVerificationStatus("success");
          setNewReport({
            ...newReport,
            materialType: parsedResult.temperatureType,
            temperature: parseInt(parsedResult.quantity),
          });
        }
      } catch (error) {
        console.log("Invalid verification results", error);
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.log("Error verifying report", error);
      setVerificationStatus("failure");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== "success" || !user) {
      toast.error(
        "Please verify the report before submitting or login to continue"
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const report = (await createReport(
        user.id,
        newReport.location,
        newReport.temperature,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      )) as any;

      const formattedReport = {
        id: report.id,
        location: report.location,
        materialType: report.materialType,
        temperature: report.temperature,
        status: report.status,
        created_at: report.created_at.toISOString().split("T")[0],
      };

      setReports([formattedReport, ...reports]);
      setNewReport({
        location: "",
        materialType: "",
        temperature: 0,
      });
      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      toast.success(
        `Report submitted successfully!You've earned points for reporting  the temperature of the material.`
      );
    } catch (error) {
      console.log("Error submitting report", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem("userEmail");
      if (email) {
        let user = await getUserByEmail(email);
        setUser(user);

        const recentReports = (await getRecentReports()) as any;
        const formattedReports = recentReports?.map((report: any) => ({
          ...report,
          created_at: report.created_at.toISOString().split("T")[0],
        }));
        setReports(formattedReports);
      } else {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Report Temperature
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg mb-12"
      >
        {/* */}
        <div className="mb-8">
          <label
            htmlFor="temp-image"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Upload Temperature Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="temp-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="temp-image"
                    name="temp-image"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {preview && (
          <div className="mt-4 mb-8">
            <img
              src={preview}
              alt="Temperature preview"
              className="max-w-full h-auto rounded-xl shadow-md"
            />
          </div>
        )}

        <Button
          type="button"
          onClick={handleVerify}
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transsition-colors duration-300"
          disabled={!file || verificationStatus === "verifying"}
        >
          {verificationStatus === "verifying" ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-3 -ml-1 text-white" />
              Verifying...
            </>
          ) : (
            "Verify Material Temperature"
          )}
        </Button>
      </form>
    </div>
  );
}
