declare module 'wav';

interface MediaTrackCapabilities {
  torch?: MediaTrackCapability;
  zoom?: MediaTrackCapability;
  pointsOfInterest?: MediaTrackCapability;
}

interface MediaTrackConstraintSet {
  torch?: ConstrainBoolean;
  zoom?: ConstrainDouble;
  pointsOfInterest?: ConstrainPoint2D;
}

interface MediaTrackSettings {
  torch?: boolean;
  zoom?: number;
  pointsOfInterest?: Point2D;
}

interface MediaTrackSupportedConstraints {
  torch?: boolean;
  zoom?: boolean;
  pointsOfInterest?: boolean;
}

interface MediaTrackConstraintSet {
  advanced?: MediaTrackConstraintSet[];
}