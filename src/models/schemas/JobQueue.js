export class JobQueue{
  constructor() {
    this.type = null;
    this.status = null;
    this.objects = {}; // JavaScript object used in place of Dictionary<string, string>
    this.jobId = crypto.randomUUID();
    this.startedOn = null;
    this.completedOn = null;
    this.runningTime = 0;
    this.deletedOn = null;
    this.deletedBy = null;
    this.errorMessage = null;
    this.signedToken = null;
  }
}