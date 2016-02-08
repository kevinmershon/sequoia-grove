

create or replace view bajs_history as (
    select id, history
    from bajs_employee e
    full outer join
    (
    select employee_id as eid, LISTAGG(to_char(date_employed, 'mm-dd-yyyy')||':'||to_char(date_unemployed, 'mm-dd-yyyy'), ',') 
    WITHIN GROUP (ORDER BY employee_id) AS history
    from bajs_employment_history h
    group by employee_id
    ) pos
    on e.id = pos.eid
)


/
