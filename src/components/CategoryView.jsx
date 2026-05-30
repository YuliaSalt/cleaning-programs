import { getCategory, getCategoryUnits } from '../data/departments.js'
import ScreenHeader from './ScreenHeader.jsx'

export default function CategoryView({ categoryId, onSelectUnit, onGoHome }) {
  const category = getCategory(categoryId)
  if (!category) return null
  const units = getCategoryUnits(categoryId)

  return (
    <div>
      <ScreenHeader
        title={category.name}
        onBack={onGoHome}
        trail={[{ label: 'ראשי', onClick: onGoHome }, { label: category.name }]}
      />

      <div className="card-grid">
        {units.map((u) => (
          <button key={u.id} className="unit-card" onClick={() => onSelectUnit(u.id)}>
            <span className="uc-name">{u.name}</span>
            <span className="uc-meta">{u.shifts.join(' · ')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
