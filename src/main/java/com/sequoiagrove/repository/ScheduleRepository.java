package com.sequoiagrove.controller;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import com.sequoiagrove.model.Day;
import com.sequoiagrove.controller.Application;
import com.sequoiagrove.model.ScheduleRow;

@Repository
public class ScheduleRepository {
  protected final Logger log = LoggerFactory.getLogger(getClass());

  // get schedule rows by sending starting monday and location id
  public ArrayList<ScheduleRow> getSchedule(Object[] args) {
    JdbcTemplate jdbc = Application.getJdbcTemplate();
    String sql = "select * from sequ_get_schedule(?) where location_id = ?";
    return (ArrayList<ScheduleRow>) jdbc.query(sql, args, scheduleRowMapper);
  }

  // determine if schedule is published by sending starting monday and location id
  public boolean isPublished(Object[] args) {
    JdbcTemplate jdbc = Application.getJdbcTemplate();
    String sql = "SELECT count(*) FROM sequ_published_schedule WHERE start_date = to_date(?,'mm-dd-yyyy') and location_id = ?";
    int count = jdbc.queryForObject(sql, args, Integer.class);
    return (count>0)? true: false;
  }

  private static final RowMapper<ScheduleRow> scheduleRowMapper = new RowMapper<ScheduleRow>() {
    public ScheduleRow mapRow(ResultSet rs, int rowNum) throws SQLException {
      ScheduleRow row = new ScheduleRow();
      row.setIndex(rs.getInt("index"));
      row.setSid(rs.getInt("sid"));
      row.setPid(rs.getInt("pid"));
      row.setLocation(rs.getString("location"));
      row.setTname(rs.getString("tname"));
      row.setPosition(rs.getString("pos"));
      row.setWeekdayStart(rs.getString("wd_st"));// weekday start
      row.setWeekdayEnd(rs.getString("wd_ed"));// weekday end
      row.setWeekendStart(rs.getString("we_st"));// weekend start
      row.setWeekendEnd(rs.getString("we_ed"));// weekend end
      row.setMon( new Day("mon", rs.getString("mon"), rs.getInt("mon_eid")));
      row.setTue(new Day("tue", rs.getString("tue"), rs.getInt("tue_eid")));
      row.setWed(new Day("wed", rs.getString("wed"), rs.getInt("wed_eid")));
      row.setThu(new Day("thu", rs.getString("thu"), rs.getInt("thu_eid")));
      row.setFri(new Day("fri", rs.getString("fri"), rs.getInt("fri_eid")));
      row.setSat(new Day("sat", rs.getString("sat"), rs.getInt("sat_eid")));
      row.setSun(new Day("sun", rs.getString("sun"), rs.getInt("sun_eid")));
      return row;
    }
  };


}