
import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import './GlobalJobsMap.css';

const LOCATION_COORDINATES = [
  { city: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { city: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
  { city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
];

const COUNTRY_ALIASES = [
  ['UK', 'United Kingdom'],
  ['USA', 'United States'],
  ['US', 'United States'],
  ['UAE', 'United Arab Emirates'],
];

function getLocation(job) {
  const rawLocation = [
    job.location,
    job.city,
    job.country,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();

  if (!rawLocation) return null;

  const lower = rawLocation.toLowerCase();

  if (
    lower.includes('remote') ||
    lower.includes('worldwide') ||
    lower.includes('global')
  ) {
    return null;
  }

  const alias = COUNTRY_ALIASES.find(([shortName]) =>
    new RegExp(`\\b${shortName.toLowerCase()}\\b`).test(lower)
  );

  const normalizedLocation = alias
    ? lower.replace(
        new RegExp(`\\b${alias[0].toLowerCase()}\\b`, 'g'),
        alias[1].toLowerCase()
      )
    : lower;

  return (
    LOCATION_COORDINATES.find((location) => {
      const cityMatch = normalizedLocation.includes(
        location.city.toLowerCase()
      );

      const countryMatch = normalizedLocation.includes(
        location.country.toLowerCase()
      );

      return cityMatch && countryMatch;
    }) ||
    LOCATION_COORDINATES.find((location) => {
      return (
        normalizedLocation.includes(location.city.toLowerCase()) &&
        !job.country
      );
    }) ||
    null
  );
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function JobLocationMarker({ location, jobs, onLocationSelect }) {
  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={10 + Math.min(jobs.length, 8)}
      pathOptions={{
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#C76B4A',
        fillOpacity: 0.9,
      }}
    >
      <Popup>
        <div className="map-popup">
          <strong>{location.city}</strong>
          <span>{location.country}</span>

          <b>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available
          </b>

          <ul>
            {jobs.slice(0, 5).map((job, index) => (
              <li key={job.id || `${job.title}-${index}`}>
                {job.title}
                {job.company ? ` · ${job.company}` : ''}
              </li>
            ))}
          </ul>

          {jobs.length > 5 && (
            <small>And {jobs.length - 5} more opportunities</small>
          )}

          <button
            type="button"
            onClick={() =>
              onLocationSelect(location.country, location.city)
            }
          >
            View jobs in {location.city}
          </button>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function GlobalJobsMap({
  jobs = [],
  onLocationSelect = () => {},
}) {
  const groupedLocations = useMemo(() => {
    const groups = new Map();

    jobs.forEach((job) => {
      const location = getLocation(job);

      if (!location) return;

      const key = `${location.city}-${location.country}`;

      if (!groups.has(key)) {
        groups.set(key, {
          ...location,
          jobs: [],
        });
      }

      groups.get(key).jobs.push(job);
    });

    return Array.from(groups.values());
  }, [jobs]);

  const totalMappedJobs = groupedLocations.reduce(
    (total, location) => total + location.jobs.length,
    0
  );

  return (
    <section className="global-jobs-map-section">
      <div className="global-jobs-map-heading">
        <div>
          <span className="section-eyebrow">GLOBAL OPPORTUNITIES</span>
          <h3>Explore jobs around the world</h3>
          <p>
            Select a location marker to discover opportunities in that city.
          </p>
        </div>

        <span className="map-location-count">
          {groupedLocations.length} locations
        </span>
      </div>

      <div className="global-jobs-map">
        <MapContainer
          center={[25, 10]}
          zoom={2}
          minZoom={2}
          scrollWheelZoom={true}
          className="global-jobs-leaflet"
          worldCopyJump={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapResizeHandler />

          {groupedLocations.map((location) => (
            <JobLocationMarker
              key={`${location.city}-${location.country}`}
              location={location}
              jobs={location.jobs}
              onLocationSelect={onLocationSelect}
            />
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <span className="map-legend-dot" />
        <span>Job locations</span>
        <span className="map-legend-note">
          {totalMappedJobs} jobs displayed on map · Remote jobs are not pinned
        </span>
      </div>

      {groupedLocations.length === 0 && (
        <p className="map-no-locations">
          No matching mapped locations yet. Try adding jobs in supported cities.
        </p>
      )}
    </section>
  );
}
