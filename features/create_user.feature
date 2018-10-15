Feature: Create user
    As admin user
    I want to be able to create new user accounts

    Scenario: Successfully create new user
        Given I am logged in as "ADMIN"
        When I click "Users" menu link
        And I click "Create User" button
        And I fill "email" with "john.brown@example.com"
        And I fill "name" with "John"
        And I fill "surname" with "Brown"
        And I fill "role" with "RESEARCHER"
        And I fill "password" with "password1"
        And I click "Save" button
        Then I should be at "Users" page
        And I should see in table:
            | Name | Surname | Email                  | Role       |
            | John | Brown   | john.brown@example.com | RESEARCHER |
