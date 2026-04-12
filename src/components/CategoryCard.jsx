/* Category Card component */
import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryCard.css';

export default function CategoryCard({ category, size = 'md' }) {
  return (
    <Link to={`/explore?category=${category.slug}`} className={`category-card category-card-${size}`}>
      <div className="category-card-icon" style={{ background: category.color + '18' }}>
        <span>{category.icon}</span>
      </div>
      <div className="category-card-text">
        <h3 className="category-card-name">{category.name}</h3>
        {size !== 'sm' && (
          <p className="category-card-count">{category.templateCount} templates</p>
        )}
      </div>
    </Link>
  );
}
