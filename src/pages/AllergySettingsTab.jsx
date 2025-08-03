import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext"; // Use the Auth context
import { toast } from "react-hot-toast"

const AllergySettingsTab = () => {
  const [allAllergies, setAllAllergies] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]); // ✅ Use names, not IDs
  const { token } = useAuth(); // Use the Auth context to get the token
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, userRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/Allergy/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/Allergy/my-allergies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAllAllergies(allRes.data); // List of { id, name }
        setSelectedNames(userRes.data); // List of lowercase strings
      } catch (err) {
        console.error("Failed to load allergy data", err);
      }
    };

    fetchData();
  }, [token]);

  const toggleSelection = (name) => {
    setSelectedNames((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const handleSave = async () => {
    try {
      // ✅ Convert selectedNames → matching IDs
      const selectedIds = allAllergies
        .filter((a) => selectedNames.includes(a.name.toLowerCase()))
        .map((a) => a.id);

      await axios.put(`${API_BASE_URL}/api/Allergy/update`, selectedIds, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Allergy preferences saved successfully!");
    } catch (err) {
      console.error("Failed to update allergies", err);
      toast.error("Failed to save preferences.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-white space-y-10">
      <div className="bg-platerly-card border border-platerly-border rounded-xl shadow p-6">
       

        <p className="text-sm text-platerly-subtle mb-6">
          Tap to toggle allergens you'd like to be warned about in recipes.
        </p>

        <div className="flex flex-wrap gap-3">
          {allAllergies.map((a) => {
            const isSelected = selectedNames.includes(a.name.toLowerCase());
            return (
              <button
                key={a.id}
                onClick={() => toggleSelection(a.name.toLowerCase())}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                  isSelected
                    ? "bg-green-600 border-green-700 text-white shadow"
                    : "bg-neutral-800 border-neutral-700 text-gray-300 hover:bg-neutral-700"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllergySettingsTab;
