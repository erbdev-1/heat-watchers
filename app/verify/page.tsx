"use client";
import { useState, useEffect } from "react";
import {
  ImagePlus,
  MapPin,
  CheckCircle,
  Clock,
  Cloud,
  Upload,
  Loader,
  Calendar,
  Weight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import Image from "next/image";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getUserByEmail,
  getVerifyTasks,
  saveReward,
  saveVerifiedReport,
  updateTaskStatus,
} from "@/utils/db/actions";

const geminiApiKey = process.env.GEMINI_API_KEY as string;

type VerifyTask = {
  id: number;
  location: string;
  materialType: string;
  temperature: number;
  weather: number;
  status: "pending" | "in_progress" | "completed" | "verified";
  date: string;
  collectorId: number;
};

const ITEMS_PER_PAGE = 5;

export default function VerifyPage() {
  const [tasks, setTasks] = useState<VerifyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMaterielType, setHoveredMaterialType] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  // Fetch user and tasks on page load
  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true);
      try {
        // Fetch user
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            toast.error("User not found. Please log in again.");
            // Redirect to login page or handle this case appropriately
          }
        } else {
          toast.error("User not logged in. Please log in.");
          // Redirect to login page or handle this case appropriately
        }

        // Fetch tasks
        const fetchedTasks = await getVerifyTasks();
        console.log("Fetched tasks:", fetchedTasks);
        setTasks(fetchedTasks as VerifyTask[]);
      } catch (error) {
        console.error("Error fetching user and tasks:", error);
        toast.error("Failed to load user data and tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, []);

  const [selectedTask, setSelectedTask] = useState<VerifyTask | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(
    null
  );
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<{
    MaterialTypeMatch: boolean;
    expectedTemperatureRange: boolean;
    confidence: number;
  } | null>(null);
  const [_reward, setReward] = useState<number | null>(null);

  // Handle task verification

  const handleStatusChange = async (
    taskId: number,
    newStatus: VerifyTask["status"]
  ) => {
    if (!user) {
      toast.error("User not found. Please log in again.");
      return;
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id);
      if (updatedTask) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, collectorId: user.id }
              : task
          )
        );
        toast.success("Task status updated successfully.");
      } else {
        toast.error("Failed to update task status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status. Please try again.");
    }
  };

  // Handle image upload

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle verification using Gemini API

  const _readFileAsBase64 = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error("Missing task, image, or user data. Please try again.");
      return;
    }

    setVerificationStatus("verifying");

    try {
      // Base64 formatına dönüştür
      const base64Data = verificationImage.split(",")[1];

      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an expert in material verification and temperature analysis. Please analyze the image and respond:
        
        1. Does the material in the image match the task's material type: "${selectedTask.materialType}"?
        2. Based on the current weather temperature (${selectedTask.weather}°C), is the temperature within the expected range for this material?
        3. Provide your confidence level in this assessment as a number between 0 and 1.
  
        Respond in JSON format like this:
        {
          "materialTypeMatch": true/false,
          "temperatureWithinRange": true/false,
          "confidence": number
        }
      `;

      // Modeli çağır ve sonucu al
      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        prompt,
      ]);

      const response = await result.response.text();

      // Gelen veriyi temizle ve parse et
      const cleanedResponse = response.replace(/```json|```/g, "").trim();
      const parsedResult = JSON.parse(cleanedResponse);

      if (
        parsedResult.materialTypeMatch !== undefined &&
        parsedResult.temperatureWithinRange !== undefined &&
        parsedResult.confidence !== undefined
      ) {
        setVerificationResult({
          MaterialTypeMatch: parsedResult.materialTypeMatch,
          expectedTemperatureRange: parsedResult.temperatureWithinRange,
          confidence: parsedResult.confidence,
        });

        if (
          parsedResult.materialTypeMatch &&
          parsedResult.temperatureWithinRange &&
          parsedResult.confidence > 0.7
        ) {
          // Doğrulama başarılıysa durumu güncelle
          await handleStatusChange(selectedTask.id, "verified");

          // Ödül hesaplama
          const earnedReward = Math.floor(Math.random() * 50) + 10; // Rastgele 10 ile 59 arasında ödül
          setReward(earnedReward);

          // Ödülü kaydet
          await saveReward(user.id, earnedReward);

          // Save the verify report
          await saveVerifiedReport(selectedTask.id, user.id, parsedResult);

          setReward(earnedReward);

          // Başarı mesajı
          toast.success(
            `Verification successful! You earned ${earnedReward} tokens!`,
            { duration: 5000, position: "top-center" }
          );
        } else {
          // Doğrulama başarısız mesajı
          toast.error(
            "Verification failed. The material or temperature does not match the expected criteria.",
            { duration: 5000, position: "top-center" }
          );
        }

        setVerificationStatus("success");
      } else {
        throw new Error("Incomplete response from the AI model.");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setVerificationStatus("failure");
      toast.error("Verification process failed. Please try again.");
    }
  };

  // Pagination and filtering
  const filteredTasks = tasks.filter((task) =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Temperature Verification Tasks
      </h1>

      {/* Search Bar */}
      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Search by area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          {/* Task List */}
          <div className="space-y-4">
            {paginatedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                    {task.location}
                  </h2>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center relative">
                    <ImagePlus className="w-4 h-4 mr-2 text-gray-500" />
                    <span
                      onMouseEnter={() =>
                        setHoveredMaterialType(task.materialType)
                      }
                      onMouseLeave={() => setHoveredMaterialType(null)}
                      className="cursor-pointer"
                    >
                      {task.materialType}
                    </span>
                    {hoveredMaterielType === task.materialType && (
                      <div className="absolute top-full left-0 bg-gray-800 text-white p-2 shadow-lg rounded text-xs">
                        Material Type: {task.materialType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-500" />
                    {task.temperature}°C
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {task.date}
                  </div>
                  <div className="flex items-center">
                    <Cloud className="w-4 h-4 mr-2 text-gray-500" />
                    {task.weather ?? "N/A"}°C
                  </div>
                </div>
                <div className="flex justify-end">
                  {task.status === "pending" && (
                    <Button
                      onClick={() => handleStatusChange(task.id, "in_progress")}
                      variant="outline"
                      size="sm"
                    >
                      Start Verify
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Button
                      onClick={() => setSelectedTask(task)}
                      variant="outline"
                      size="sm"
                    >
                      Complete & Verify
                    </Button>
                  )}
                  {task.status === "verified" && (
                    <span className="text-green-600 text-sm font-medium">
                      Reward Earned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="mr-2"
            >
              Previous
            </Button>
            <span className="mx-2 self-center">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={currentPage === pageCount}
              className="ml-2"
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Verification Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Verify Collection</h3>
            <p className="mb-4 text-sm text-gray-600">
              Upload a photo of the collected material to verify and earn your
              reward.
            </p>
            <div className="mb-4">
              <label
                htmlFor="verification-image"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="verification-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="verification-image"
                        name="verification-image"
                        type="file"
                        className="sr-only"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
            {verificationImage && (
              <Image
                src={verificationImage}
                alt="Verification"
                className="mb-4 rounded-md w-full"
                width={300}
                height={300}
              />
            )}
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={
                !verificationImage || verificationStatus === "verifying"
              }
            >
              {verificationStatus === "verifying" ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Verifying...
                </>
              ) : (
                "Verify Collection"
              )}
            </Button>
            {verificationStatus === "success" && verificationResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p>
                  Material Type Match:{" "}
                  {verificationResult.MaterialTypeMatch ? "Yes" : "No"}
                </p>
                <p>
                  Temperature Range Match:{" "}
                  {verificationResult.expectedTemperatureRange ? "Yes" : "No"}
                </p>
                <p>
                  Confidence: {(verificationResult.confidence * 100).toFixed(2)}
                  %
                </p>
                <p>Weather: {selectedTask.weather}°C</p>
              </div>
            )}
            {verificationStatus === "failure" && (
              <p className="mt-2 text-red-600 text-center text-sm">
                Verification failed. Please try again.
              </p>
            )}
            <Button
              onClick={() => setSelectedTask(null)}
              variant="outline"
              className="w-full mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: VerifyTask["status"] }) {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    in_progress: { color: "bg-blue-100 text-blue-800", icon: ImagePlus },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    verified: { color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  };

  const { color, icon: Icon } = statusConfig[status];

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {status.replace("_", " ")}
    </span>
  );
}
