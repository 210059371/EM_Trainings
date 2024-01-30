/*
 This software is provided "AS IS," without a warranty of any kind.  ALL
 EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-
 INFRINGEMENT, ARE HEREBY EXCLUDED.  ANCILE AND ITS LICENSORS SHALL NOT BE LIABLE
 FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR
 DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL ANCILE OR ITS
 LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 OR INABILITY TO USE SOFTWARE, EVEN IF ANCILE HAS BEEN ADVISED OF THE POSSIBILITY
 OF SUCH DAMAGES.
*/

/** 
* Creates custom communication object
* @classDescription This class handles all custom data persistance
* @constructor
*/
var CommFactoryCustom = function()
{
	this.startDate = '';
	this.autoCompleteOnAllPagesVisited = false;
	this.matchSep = '.';
	this.groupSep = ',';
	this.interactionTrueString = 't';
	this.interactionFalseString = 'f';
	this.enableManualSubmit = true;
	this.autoRun = true;
	this.ready = false;
	this.completeOnThreshold = false;
	
	this.initialize = function()
	{
		this.ready = true;
		return true;
	};
	
	this.terminate = function()
	{
		this.ready = false;
		return true;
	};
	
	this.commit = function()
	{
		return true;
	};
	
	this.setLocation = function(lesson_location)
	{
		// stub
	};
	
	this.getLocation = function()
	{
		return '';
	};
	
	this.setCompletionStatus = function(lesson_status)
	{
		// stub
	};
	
	this.getCompletionStatus = function()
	{
		return '';
	};
	
	this.setScore = function(score)
	{
		// stub
	};
	
	this.getScore = function()
	{
		return '';
	};
	
	this.setSuspendData = function(suspend_data)
	{
		// stub
	};
	
	this.getSuspendData = function()
	{
		return '';
	};
	
	this.setSuccessStatus = function(success_status)
	{
		return true;
	};
	
	this.getSuccessStatus = function(success_status)
	{
		return false;
	};
	
	this.setCompleted = function(completionString)
	{
		// stub
	};
	
	this.setInteractionId = function(id, name){return true;};
	this.setInteractionType = function(id, type){return true;};
	this.setInteractionDescription = function(id, stem){return true;};
	this.setInteractionCorrectResponse = function(id, correct_response){return true;};
	this.setInteractionStudentResponse = function(id, student_response){return true;};
	this.setInteractionResult = function(id,result){return true;};
	
	this.setSessionTime = function(){return true;};
	
	this.sendResults = function(o){};
	
	// applicable to SCORM/uPerform server
	this.setProgressStatus = function(percent_complete){return true;};
	this.getProgressStatus = function(){return false;};
	this.setCompletionThreshold = function(){return true;};
	this.getCompletionThreshold = function(){return false;};
	this.setSimMode = function(simulation_mode){return true;};
	this.getSimMode = function(){return false;};
};
