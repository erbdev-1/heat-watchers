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
      objectType: string;
      temperature: number;
      weather: number;
      status: string;
      created_at: string;
    }>
  >([]);

  const [newReport, setNewReport] = useState({
    location: "",
    objectType: "",
    temperature: 0,
    weather: 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");

  const [verificationResult, setVerificationResult] = useState<{
    temperatureType: string;
    expectedTemperatureRange: string;
    confidence: number;
    isWithinRange: boolean;
    objectTypeMatch: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  });

  const objectTypes = [
    {
      label: "Nature",
      options: [
        "Leaves",
        "Rocks",
        "Flowers",
        "Soil",
        "Fruits",
        "Trees",
        "Animals",
        "Insects",
      ],
    },
    {
      label: "Home",
      options: [
        "Furniture",
        "Electronics",
        "Clothing",
        "Books",
        "Food",
        "Utensils",
        "Decorations",
      ],
    },
    {
      label: "School",
      options: [
        "Chairs",
        "Desks",
        "Stationery",
        "Pens",
        "Notebooks",
        "Erasers",
        "Whiteboards",
        "Markers",
        "School Bags",
      ],
    },
    {
      label: "General",
      options: [
        "Recyclable Materials",
        "Non-Recyclable Materials",
        "Plastic Bags",
        "Styrofoam",
        "Trash",
      ],
    },
    {
      label: "Other",
      options: ["Other"],
    },
  ];

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = async () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];

        const location = place.formatted_address || "";
        try {
          const weatherTemperature = await getWeather(location);

          setNewReport((prev) => ({
            ...prev,
            location: location,
            weather: weatherTemperature || 0,
          }));
          toast.success(`Weather data fetched: ${weatherTemperature}°C`);
        } catch (error) {
          console.error("Error fetching weather data:", error);
          toast.error("Could not fetch weather data.");
        }
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
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const mapObjectType = (detectedType: string): string | null => {
    for (const category of objectTypes) {
      if (category.options.includes(detectedType)) {
        return detectedType;
      }
    }
    return null; // Eğer eşleşme yoksa null döner
  };

  const handleVerify = async () => {
    if (!file || !newReport.location) {
      setVerificationStatus("failure");
      setVerificationResult({
        temperatureType: "Unknown",
        expectedTemperatureRange: "N/A",
        confidence: 0,
        isWithinRange: false,
        objectTypeMatch: false,
      });
      return;
    }

    setVerificationStatus("verifying");

    try {
      const weatherTemperature = await getWeather(newReport.location);
      if (weatherTemperature === null) throw new Error("Invalid location");

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const objectCategories = objectTypes
        .map((category) => `${category.label}: ${category.options.join(", ")}`)
        .join("\n");

      const prompt = `
        You are an expert in temperature and object type analysis. Analyze the given object and provide a detailed report:
        
        1. Identify the type of object in the image based on the following categories:
        ${objectCategories}
        
        2. Based on the current weather temperature (${weatherTemperature}°C), estimate the expected temperature range for this object.
        3. Provide your confidence level in this analysis.
  
        Respond in JSON format like this:
        {
          "temperatureType": "detected type of object",
          "expectedTemperatureRange": "range of expected temperature in °C",
          "confidence": "confidence level as a decimal between 0 and 1"
        }
      `;

      const result = await model.generateContent([
        { inlineData: { data: base64.split(",")[1], mimeType: file.type } },
        prompt,
      ]);

      const response = await result.response;

      const cleanedResponse = response
        .text()
        .replace(/```json|```/g, "")
        .trim();

      const parsedResult = JSON.parse(cleanedResponse);

      if (
        parsedResult.temperatureType &&
        parsedResult.expectedTemperatureRange &&
        parsedResult.confidence !== undefined
      ) {
        // Parse temperature range
        const [minTemp, maxTemp] = parsedResult.expectedTemperatureRange
          .replace("°C", "")
          .split(" - ") // Değişiklik burada
          .map((temp: any) => parseFloat(temp.trim()));

        const userTemperature = newReport.temperature; // Ensure numeric comparison

        // Adjusted logic for range validation
        const isWithinRange =
          userTemperature >= minTemp && userTemperature <= maxTemp;
        const objectTypeMatch = mapObjectType(parsedResult.temperatureType);

        // Adjust confidence based on object type match
        const confidenceAdjustment = objectTypeMatch
          ? parsedResult.confidence
          : parsedResult.confidence * 0.5;

        // Determine final status
        const isSuccess =
          isWithinRange && confidenceAdjustment >= 0.8 && objectTypeMatch;

        setVerificationResult({
          temperatureType: objectTypeMatch
            ? objectTypeMatch
            : parsedResult.temperatureType,
          expectedTemperatureRange: parsedResult.expectedTemperatureRange,
          confidence: confidenceAdjustment,
          isWithinRange,
          objectTypeMatch: objectTypeMatch === newReport.objectType,
        });

        setVerificationStatus("success");
      } else {
        throw new Error("Incomplete response from AI.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationStatus("failure");
      setVerificationResult({
        temperatureType: "Unknown",
        expectedTemperatureRange: "N/A",
        confidence: 0,
        isWithinRange: false,
        objectTypeMatch: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kullanıcı oturum kontrolü
    if (!user) {
      toast.error("User data not available. Please login again.");
      router.push("/login"); // Giriş sayfasına yönlendir
      return;
    }

    // Doğrulama kontrolü
    if (verificationStatus !== "success") {
      toast.error("Please verify the report before submitting.");
      return;
    }

    setIsSubmitting(true); // Form gönderimi başladığını işaretle

    try {
      // Veriler
      const userId = user.id;
      const location = newReport.location.trim();
      const materialType = newReport.objectType.trim();
      const temperature = parseFloat(newReport.temperature.toString());
      const weather =
        typeof newReport.weather === "number" ? newReport.weather : 0; // Weather değeri varsa kullan, yoksa 0
      const imageUrl = preview || undefined; // Görsel yoksa undefined
      const formattedVerificationResult = verificationResult
        ? JSON.stringify(verificationResult)
        : undefined; // JSONB için uygun format

      // Rapor oluşturma API çağrısı
      const report = await createReport(
        userId, // Kullanıcı ID'si
        location, // Konum
        materialType, // Malzeme türü
        temperature, // Sıcaklık
        weather, // Hava durumu
        imageUrl, // Görsel URL'si
        formattedVerificationResult // Doğrulama sonucu
      );

      if (!report) {
        throw new Error("Report creation failed. Please try again.");
      }

      // Raporu formatla
      const formattedReport = {
        id: report.id,
        location: report.location,
        objectType: report.materialType,
        temperature: report.temperature,
        weather: typeof report.weather === "number" ? report.weather : 0,
        status: report.status,
        created_at: new Date(report.created_at).toISOString().split("T")[0],
      };

      // Yeni raporu listeye ekle
      setReports([formattedReport, ...reports]);

      // Formu sıfırla
      setNewReport({
        location: "",
        objectType: "",
        temperature: 0,
        weather: 0,
      });
      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      toast.success(
        `Report submitted successfully! You've earned points for reporting the temperature of the object.`
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(
        "An error occurred while submitting the report. Please try again."
      );
    } finally {
      setIsSubmitting(false); // Form gönderimi tamamlandığını işaretle
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem("userEmail");

      if (!email) {
        toast.error("User email not found. Redirecting to login.");
        router.push("/"); // Kullanıcı giriş sayfasına yönlendirilir
        return;
      }

      try {
        // Kullanıcı verisini al
        const userData = await getUserByEmail(email);

        if (!userData) {
          toast.error("User not found. Please log in again.");
          router.push("/"); // Kullanıcı giriş sayfasına yönlendirilir
          return;
        }

        // Kullanıcıyı state'e kaydet
        setUser(userData);

        // Son raporları getir ve formatla
        const recentReports = await getRecentReports();
        const formattedReports = recentReports?.map((report: any) => ({
          ...report,
          created_at: new Date(report.created_at).toISOString().split("T")[0],
        }));

        setReports(formattedReports || []);
      } catch (error) {
        console.error("Error in checkUser:", error);
        toast.error("An error occurred while fetching user data.");
        router.push("/"); // Hata durumunda giriş sayfasına yönlendirilir
      }
    };

    checkUser(); // Kullanıcı kontrolü başlat
  }, [router]); // `router` dışındaki bağımlılıklar gerekirse eklenir

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800">
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

        {/*VERIFICATION RESULT */}

        {/* {verificationResult && (
          <div
            className={`p-4 mb-8 rounded-r-xl ${
              verificationStatus === "success"
                ? "bg-green-50 border-l-4 border-green-400"
                : "bg-red-50 border-l-4 border-red-400"
            }`}
          >
            <div className="flex items-center">
              <CheckCircle
                className={`h-6 w-6 mr-3 ${
                  verificationStatus === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              />
              <div>
                <h3
                  className={`text-lg font-medium ${
                    verificationStatus === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {verificationStatus === "success"
                    ? "Verification Successful"
                    : "Verification Failed"}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    verificationStatus === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  <p>Temperature Type: {verificationResult.temperatureType}</p>
                  <p>
                    Expected Temperature Range:{" "}
                    {verificationResult.expectedTemperatureRange}
                  </p>
                  <p>User Temperature: {newReport.temperature}°C</p>
                  <p>
                    Validation Result:{" "}
                    {verificationResult.isWithinRange
                      ? `User temperature (${newReport.temperature}°C) is within the expected range (${verificationResult.expectedTemperatureRange}).`
                      : `User temperature (${newReport.temperature}°C) is outside the expected range (${verificationResult.expectedTemperatureRange}).`}
                  </p>
                  <p>
                    Confidence:{" "}
                    {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>
                  <p>
                    Object Type Match:{" "}
                    {verificationResult.objectTypeMatch ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {verificationResult && (
          <div className="p-4 mb-8 rounded-r-xl bg-green-50 border-l-4 border-green-400">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  Verification Successful
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Temperature Type: {verificationResult.temperatureType}</p>
                  <p>
                    Expected Temperature Range:{" "}
                    {verificationResult.expectedTemperatureRange}
                  </p>
                  <p>User Temperature: {newReport.temperature}°C</p>
                  <p>
                    Validation Result:{" "}
                    {verificationResult.isWithinRange
                      ? `User temperature (${newReport.temperature}°C) is within the expected range (${verificationResult.expectedTemperatureRange}).`
                      : `User temperature (${newReport.temperature}°C) is outside the expected range (${verificationResult.expectedTemperatureRange}).`}
                  </p>
                  <p>
                    Confidence:{" "}
                    {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>
                  <p>
                    Object Type Match:{" "}
                    {verificationResult.objectTypeMatch ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-2">
          {/*LOCATION */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            {isLoaded ? (
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="Enter temperature location"
                />
              </StandaloneSearchBox>
            ) : (
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="Enter temperature location"
              />
            )}
          </div>
          {/*OBJECT TYPE */}

          <div>
            <label
              htmlFor="objectType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Object
            </label>
            <select
              id="objectType"
              name="objectType"
              value={newReport.objectType}
              onChange={(e) =>
                setNewReport((prev) => ({
                  ...prev,
                  objectType: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            >
              <option value="" disabled>
                Select object type
              </option>
              {objectTypes.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {/*TEMPERATURE */}
          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Temperature (°C)
            </label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={newReport.temperature}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="Enter temperature"
            />
          </div>
          {/*WEATHER */}
          <div>
            <label
              htmlFor="weather"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Weather (°C)
            </label>
            <input
              type="number"
              id="weather"
              name="weather"
              value={newReport.weather}
              // onChange={handleInputChange}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="Enter weather"
            />
          </div>
        </div>

        {/*VERIFY */}
        <Button
          type="button"
          onClick={handleVerify}
          className="w-full mb-6 mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transsition-colors duration-300"
          disabled={!file || verificationStatus === "verifying"}
        >
          {verificationStatus === "verifying" ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-3 -ml-1 text-white" />
              Verifying...
            </>
          ) : (
            "Verify Object Temperature"
          )}
        </Button>

        {/*SUBMIT */}
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl *transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-3 -ml-1 text-white" />
              Submitting...
            </>
          ) : (
            "Submit Report"
          )}
        </Button>
      </form>

      {/*RECENT REPORTS */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Recent Reports
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weather (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(reports) && reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                      {report.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.objectType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.temperature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.weather}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.created_at}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No reports available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
