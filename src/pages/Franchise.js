import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { franchiseService } from "../lib/services";
import Navbar from "./Navbar";
import "../styles/franchise-search.scss";

const FranchiseSearch = () => {
  const [query, setQuery] = useState("");
  const [franchises, setFranchises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setFranchises([]);
      return;
    }
    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await franchiseService.get("/search", {
          params: { query },
        });
        setFranchises(response.data);
      } catch (error) {
        console.error("Error searching franchises:", error);
        toast.error("Failed to search franchises. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Define popular franchises (aligned with custom franchise pages)
  const popularFranchises = [
    { name: "MCU", id: "mcu", path: "/popularfranchises/mcu" },
    { name: "DCEU", id: "dceu", path: "/popularfranchises/dceu" },
    { name: "DCU", id: "dcu", path: "/popularfranchises/dcu" },
    { name: "Star Wars", id: "starwars", path: "/popularfranchises/starwars" },
    { name: "Aliens", id: "aliens", path: "/popularfranchises/aliens" },
    {
      name: "Harry Potter",
      id: "harrypotter",
      path: "/popularfranchises/harrypotter",
    },
    { name: "Lord of the Rings", id: "lotr", path: "/popularfranchises/lotr" },
  ];

return (
  <div className="franchise-search-container">
    <Navbar />

    <div className="background-animation">
      <div className="animated-orb"></div>
      <div className="animated-orb"></div>
      <div className="animated-orb"></div>
    </div>

    <div className="content-wrapper single-column">
      {/* Popular Franchises is now the MAIN section */}
      <div className="popular-franchises main-popular">
        <h2>Explore Popular Franchises</h2>

        <div className="franchise-buttons glassy-grid">
          {popularFranchises.map((franchise) => (
            <Link
              to={franchise.path}
              key={franchise.id}
              className="franchise-button glassy-color"
            >
              {franchise.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </div>
);

};

export default FranchiseSearch;
