import { useState, useEffect } from "react";
import logo from "./assets/WattsUpLogo.png";
import { Tag } from "./components/Tag";

interface EnergyCostData {
  cost: number;
  address: string;
}

function App() {
  const [address, setAddress] = useState<string>("");
  const [cost, setCost] = useState<number | null>(30);
  const [error, setError] = useState<string>("");

  const extractAddress = async (): Promise<string> => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url?.includes("streeteasy.com")) {
        throw new Error("WattsUp is only supported on StreetEasy listings");
      }

      const response = await chrome.tabs.sendMessage(tab.id!, {
        action: "extractAddress",
      });

      if (!response || !response.address) {
        throw new Error("Could not find address on this page");
      }

      return response.address;
    } catch (err) {
      throw new Error(
        `Failed to extract address: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const getEnergyCost = async (address: string): Promise<number> => {
    const API_ENDPOINT = "https://wattsup-0o1v.onrender.com/api/estimate";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, num_rooms: 1 }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: EnergyCostData = await response.json();
      return data.cost || 0;
    } catch {
      return 0;
    }
  };

  const calculateEnergyCost = async () => {
    try {
      setError("");
      setCost(null);

      let currentAddress = address;
      if (!currentAddress) {
        currentAddress = await extractAddress();
        setAddress(currentAddress);
      }

      const energyCost = await getEnergyCost(currentAddress);
      setCost(energyCost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  useEffect(() => {
    extractAddress()
      .then(setAddress)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to extract address"
        )
      );
  }, []);

  return (
    <div className="w-80 min-h-64 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <img src={logo} alt="WattsUp NYC" className="h-10" />
          <div className="text-2xl font-bold h-10 text-center tracking-tight text-gray-800">
            WattsUp NYC
          </div>
        </div>
        <div className="border-b border-gray-200 mx-[-16px]" />
        <div className="bg-gray-50 rounded-lg text-xs px-3 py-2 text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">📍</span>
          {address || <span className="italic text-gray-400">Address will be detected automatically...</span>}
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold text-gray-800 mb-1">Monthly Energy Estimate</div>
          {cost !== null ? (
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-extrabold text-green-700">${cost}</div>
              <Tag efficiency={cost} />
            </div>
          ) : (
            <div className="text-sm opacity-80 mb-4 text-center animate-pulse text-gray-500">
              Calculating energy costs...
            </div>
          )}
        </div>
        <ul className="ml-2 list-disc list-inside mt-2 space-y-1 text-gray-700 text-sm">
          <li>Predicted monthly energy costs using AI</li>
          <li>Based on weather, building data, and past usage</li>
          <li>
            Sustainability rating for this apartment compared to similar units
          </li>
        </ul>
        <a
          href="#"
          className="text-blue-600 hover:underline text-sm mt-2 font-medium self-start"
        >
          View details
        </a>
        {error && (
          <div className="bg-red-500/10 border border-red-300 text-red-700 rounded-lg p-3 text-sm font-medium text-center mt-2">
            {error}
          </div>
        )}
        <button
          onClick={calculateEnergyCost}
          className="w-full mt-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors duration-150"
        >
          Calculate
        </button>
      </div>
    </div>
  );
}

export default App;
