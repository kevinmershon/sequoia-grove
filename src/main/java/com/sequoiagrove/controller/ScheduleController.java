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
import com.sequoiagrove.model.Param;
import com.sequoiagrove.model.Scheduled;
import com.sequoiagrove.dao.DeliveryDAO;
import com.sequoiagrove.controller.MainController;


@Controller
public class ScheduleController {

  // Get current schedule template (current shifts) dd-mm-yyyy
    @RequestMapping(value = "/schedule/template/{mon}")
    public String getScheduleTemplate(Model model, @PathVariable("mon") String mon) {

        JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();

        List<ScheduleTemplate> schTempList = jdbcTemplate.query(
          "select * from table(bajs_pkg.get_schedule('"+ mon +"'))",
            new RowMapper<ScheduleTemplate>() {
                public ScheduleTemplate mapRow(ResultSet rs, int rowNum) throws SQLException {
                    ScheduleTemplate schTmp = new ScheduleTemplate(
                          rs.getInt("sid"),
                          rs.getInt("pid"),
                          rs.getString("location"),
                          rs.getString("tname"),
                          rs.getString("position"),
                          "", // weekday start hour
                          "", // weekday start minute
                          "", // weekday end   hour
                          "", // weekday end   minute
                          "", // weekend start minute
                          "", // weekend start minute
                          "", // weekend end   minute
                          "", // weekend end   minute
                          new Day("mon", rs.getString("mon"), rs.getInt("mon_eid")),
                          new Day("tue", rs.getString("tue"), rs.getInt("tue_eid")),
                          new Day("wed", rs.getString("wed"), rs.getInt("wed_eid")),
                          new Day("thu", rs.getString("thu"), rs.getInt("thu_eid")),
                          new Day("fri", rs.getString("fri"), rs.getInt("fri_eid")),
                          new Day("sat", rs.getString("sat"), rs.getInt("sat_eid")),
                          new Day("sun", rs.getString("sun"), rs.getInt("sun_eid")) );

                // Get int from result set and return it as a String of length 4
                String wd_start_str = intToLenFourString(rs.getInt("wd_st"));
                String wd_end_str   = intToLenFourString(rs.getInt("wd_ed"));
                String we_start_str = intToLenFourString(rs.getInt("we_st"));
                String we_end_str   = intToLenFourString(rs.getInt("we_ed"));

                // The first two characters of each string are the hours
                if (wd_start_str.length() == 4){
                    // weekday start hour and minutes
                    schTmp.setWd_st_h(wd_start_str.substring(0,2));
                    schTmp.setWd_st_m(wd_start_str.substring(2,4));

                    // weekday end hour and minutes
                    schTmp.setWd_ed_h(wd_end_str.substring(0,2));
                    schTmp.setWd_ed_m(wd_end_str.substring(2,4));
                }
                if (we_start_str.length() == 4){
                    // weekend start hour and minutes
                    schTmp.setWe_st_h(we_start_str.substring(0,2));
                    schTmp.setWe_st_m(we_start_str.substring(2,4));

                    // weekend end hour and minutes
                    schTmp.setWe_ed_h(we_end_str.substring(0,2));
                    schTmp.setWe_ed_m(we_end_str.substring(2,4));
                }
                return schTmp;
              }
          });

        // there is no schedule
        if (schTempList.size() >= 0 ) {

        }

        model.addAttribute("template", schTempList);
        return "jsonTemplate";
    }

    // Use String Builder to change int to String, and make
    // sure they are all 4 characters long
    public static String intToLenFourString(int time) {
      String ret = "";
      StringBuilder sb = new StringBuilder();
      sb.append(ret);

      if (time != 0) {
        sb.append(time);
        if (sb.length() < 4) {
             sb.insert(0, 0);
        }
        ret = sb.toString();
        // clear out string builder
        sb.delete(0, sb.length());
      }
      return ret;
    }

  // Update current schedule template (current shifts) dd/mm/yyyy
    @RequestMapping(value = "/schedule/update")
    public String updateSchedule(@RequestBody String data, Model model) throws SQLException {
        JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();

        // Parse the list of params to array of Strings
        Gson gson = new Gson();
        Scheduled [] scheduleChanges = gson.fromJson(data, Scheduled[].class);

        // update database
        for (Scheduled change : scheduleChanges) {
            jdbcTemplate.update("call bajs_pkg.schedule(?, ?, ?)", 
                change.getEid(), 
                change.getSid(), 
                change.getDate());
        }

        return "jsonTemplate";
    }

  // Delete scheduled day dd/mm/yyyy
    @RequestMapping(value = "/schedule/delete")
    public String deleteSchedule(@RequestBody String data, Model model) throws SQLException {
        JdbcTemplate jdbcTemplate = MainController.getJdbcTemplate();

        // Parse the list of params to array of Strings
        Gson gson = new Gson();
        Scheduled [] scheduleChanges = gson.fromJson(data, Scheduled[].class);

        // update database
        for (Scheduled change : scheduleChanges) {
            jdbcTemplate.update("call bajs_pkg.delete_schedule(?, ?)", 
                change.getSid(),
                change.getDate());
        }

        return "jsonTemplate";
    }
}

