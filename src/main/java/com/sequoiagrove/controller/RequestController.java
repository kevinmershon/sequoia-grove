
package com.sequoiagrove.controller;

import com.google.gson.Gson;
import java.sql.SQLException;
import java.util.List;
import java.util.ArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.ui.ModelMap;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Controller;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;

import com.sequoiagrove.model.ScheduleTemplate;
import com.sequoiagrove.model.Day;
import com.sequoiagrove.model.Request;
import com.sequoiagrove.model.RequestStatus;
import com.sequoiagrove.model.Param;
import com.sequoiagrove.model.Scheduled;
import com.sequoiagrove.dao.DeliveryDAO;
import com.sequoiagrove.controller.MainController;
/** 
RequestController:
Puts Starting Date, End Date, and Employee ID from the front end to the datebase
It will also retrieve information from the backend 
*/


@Controller
public class RequestController{
  @RequestMapping(value = "/request/submit")
    public String sumbitRequest(@RequestBody String data, Model model) throws SQLException {
      JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();
      Gson gson = new Gson();
      Request req = gson.fromJson(data, Request.class);

      int eid = req.getEid();
      String start = req.getStartDate();
      String end = req.getEndDate();

      jdbcTemplate.update(
          "insert into bajs_requests_vacation"+
          "(id, requested_by, responded_by, is_approved, start_date_time," +
          " end_date_time)" +
          "values(?, ?, ?, ?, "+
          "to_date(?, 'mm-dd-yyyy'), to_date(?, 'mm-dd-yyyy'))",
          0, eid, null, 0, start, end);
      System.out.println("Start Date: " + start + "\nEnd Date: " + end);

      return "jsonTemplate";
    }

  @RequestMapping(value = "/request/get")
    public String getRequest(Model model){
      JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();
      List<RequestStatus> requestList = jdbcTemplate.query(
          "select * from bajs_requests_vacation",
          new RowMapper<RequestStatus>() {
            public RequestStatus  mapRow(ResultSet rs, int rowNum) throws SQLException {
              RequestStatus es = new RequestStatus(
                rs.getInt("id"),
                rs.getInt("requested_by"),
                rs.getInt("responded_by"),
                checkStatus(rs.getInt("responded_by"), rs.getBoolean("is_approved")),
                rs.getString("start_date_time"),
                rs.getString("end_date_time")
                );
              return es;
            }
          });
      model.addAttribute("requestStatus", requestList);
      return "jsonTemplate";
    } 

    @RequestMapping(value = "/request/get/current/employee/{eid}")
      public String getCurrentEmployeeRequestl(Model model,
          @PathVariable("eid") int eid) throws SQLException {
            JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();
            List<RequestStatus> requestList = jdbcTemplate.query(
              "select * from bajs_requests_vacation " +
              "where requested_by = " + eid,
              new RowMapper<RequestStatus>() {
                public RequestStatus  mapRow(ResultSet rs, int rowNum) throws SQLException {
                  RequestStatus es = new RequestStatus(
                    readAndPut(rs.getInt("id")), 
                    rs.getInt("requested_by"),
                    checkApprover(rs.getInt("responded_by")),
                    checkStatus(rs.getInt("responded_by"), rs.getBoolean("is_approved")),
                    rs.getString("start_date_time"),
                    rs.getString("end_date_time")
                    );
                  return es;
                }
              });
            model.addAttribute("request", requestList);
            return "jsonTemplate";
      }

     @RequestMapping(value = "/request/accept/{eid}")
      public String changeRequest(Model model, 
          @PathVariable("eid") int eid) throws SQLException{
        //Make Sure request ID is there too...

        JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();
        jdbcTemplate.update("update bajs_requests_vacation " +
            "set " +
            "is_approved = 1 " +
            "where requested_by = " + eid
            );
        return "jsonTemplate";
      } 

     @RequestMapping(value = "/request/update/{requestID}/{approverID}/{is_approve}")
       public String updateRequest(Model model, 
           @PathVariable("requestID") int requestID,
           @PathVariable("approverID") int approverID,
           @PathVariable("is_approve") int is_approve) throws SQLException{
         //Make Sure request ID is there too...

         JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();
         jdbcTemplate.update("update bajs_requests_vacation " +
             " set" +
             " is_approved  = " + is_approve +
             ", responded_by = " + approverID +
             " where id     = " + requestID
             );
         return "jsonTemplate";
       } 


     public String checkStatus(Integer responder, boolean approval){
       // System.out.println(responder + " and request is " +  approval);
       if (responder == null | responder == 0) return "Pending";
       else{
         if(approval == true) return "Approved";
         else return "Denied";
       }
     }
     public int checkApprover(Integer responder){
       int test = 0;
       if(responder == null || responder == 0){
         // System.out.println("ApproverID: " + responder + " does not exist");
         return responder;
       }
       else{
         // System.out.println(responder + "does exist");
       }
       return 0;
     }
     public int readAndPut(int testIn){
       System.out.println("Request ID: " + testIn);
       return testIn;
     }

}

