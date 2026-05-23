const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CriterionSchema = new Schema({
  rubricId: { type: Schema.Types.ObjectId, ref: 'Rubric', required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  weight: { type: Number, required: true },
  maxScore: { type: Number, default: 10.0 },
  excellentDescription: { type: String },
  goodDescription: { type: String },
  passedDescription: { type: String },
  failedDescription: { type: String },
  order: { type: Number }
}, {
  timestamps: true
});

CriterionSchema.index({ rubricId: 1, code: 1 }, { unique: true });
CriterionSchema.index({ rubricId: 1 });

module.exports = mongoose.model('Criterion', CriterionSchema);