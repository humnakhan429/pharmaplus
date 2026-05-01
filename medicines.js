import React, { useState, useEffect } from 'react';
import './medicines.css';

const Medicines = () => {
    const [medicines, setMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [category, setCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch medicines data (Assuming an API endpoint available)
        fetch('https://api.example.com/medicines')
            .then(response => response.json())
            .then(data => {
                setMedicines(data);
                setFilteredMedicines(data);
            });
    }, []);

    useEffect(() => {
        // Filter medicines by category and search term
        const filtered = medicines.filter(medicine => {
            const matchesCategory = category ? medicine.category === category : true;
            const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        setFilteredMedicines(filtered);
    }, [category, searchTerm, medicines]);

    const handleAddToCart = (medicine) => {
        // Logic for adding medicine to cart
        console.log(`Added ${medicine.name} to cart`);
    };

    return (
        <div className="medicines-container">
            <h1>Medicines</h1>
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <select onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="analgesics">Analgesics</option>
                <option value="antibiotics">Antibiotics</option>
                <option value="antihistamines">Antihistamines</option>
            </select>
            <ul>
                {filteredMedicines.sort((a, b) => a.price - b.price).map(medicine => (
                    <li key={medicine.id}>
                        <h2>{medicine.name}</h2>
                        <p>Price: ${medicine.price} (Dow: ${medicine.dowPrice})</p>
                        <button onClick={() => handleAddToCart(medicine)}>Add to Cart</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Medicines;