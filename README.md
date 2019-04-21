# Distributed Computing Framework
The code already comes with an example Fibonacci load function.

## Get Started
1. Open Up the `Setup.js` File:
    You will need to set up the port number and the host that your Server is going to be running on. That information can be added in the `settings` object.
2. Define the `stepFunction`:
    Each task will need to have a unique input that will always be processed by the same function (`workFunction`). The stepFunction is responsible for that. In the current example the stepFunction is incrementing a number by one since the task of the workFunction is to find the next incremental fibonacci number;
3. Define the `workFunction`:
    The workFunction accepts one paremeter called `response`. The response is going to be and object containing the id of the client and the load:
    ```
    response: {
        id: 1,      //The client ID,
        load: {},   //The new load from the stepFunction
    }
    ```
    The `load` contains the same dataType as the return type of the stepFunction. For example if he stepFunction is returning 
    ```
    {
        step: 1,        //number
        weight: 0.1,    //Fload
        points: [       //Array of Objects
            {
                x: 1, 
                y: 2,
                z: 1,
            }
        ]
    }
    ```
    that's what is going to be passed to the workFunction via the response parameter.
4. Run The code:
    run `node Server.js` before `node Client.js`;

